/**
 * Try to auto-accept low-risk inbound items:
 * - Member updates where sender is updating their own stay dates
 * - Logistics where the person matches the sender
 *
 * Never auto-accept: new_travelers, events, updates to other members, logistics for others, parse errors.
 */
export async function tryAutoAccept(supabase, { inboundEmailId, tripId, parsedData, senderMemberId, members }) {
  if (!parsedData || !senderMemberId) {
    return { autoApplied: false, fullyApplied: false, summary: null, appliedItems: null, remainingItems: null };
  }

  if (parsedData.parse_error) {
    return { autoApplied: false, fullyApplied: false, summary: null, appliedItems: null, remainingItems: null };
  }

  const senderMember = (members || []).find((m) => m.id === senderMemberId);
  if (!senderMember) {
    return { autoApplied: false, fullyApplied: false, summary: null, appliedItems: null, remainingItems: null };
  }

  const appliedItems = [];
  const summaryParts = [];

  // Check member_updates: only auto-accept sender updating their own dates
  const autoMemberUpdates = [];
  const remainingMemberUpdates = [];

  for (const update of (parsedData.member_updates || [])) {
    if (update.matched_existing && update.member_id === senderMemberId) {
      autoMemberUpdates.push(update);
    } else {
      remainingMemberUpdates.push(update);
    }
  }

  // Check logistics: only auto-accept logistics for the sender
  const autoLogistics = [];
  const remainingLogistics = [];

  // Build sender name variants for matching
  const senderName = (senderMember.profiles?.display_name || senderMember.display_name || '').toLowerCase();
  const senderEmail = (senderMember.profiles?.email || senderMember.email || '').toLowerCase();

  for (const entry of (parsedData.logistics || [])) {
    const personName = (entry.person_name || '').toLowerCase().trim();
    if (!personName) {
      remainingLogistics.push(entry);
      continue;
    }

    // Same fuzzy matching as apply/route.js, with guard against empty senderName
    const matchesSender =
      (senderName && (senderName.includes(personName) || personName.includes(senderName))) ||
      (senderEmail && senderEmail.includes(personName));

    // Also verify the sender has a user_id (required for logistics FK)
    if (matchesSender && senderMember.user_id) {
      autoLogistics.push(entry);
    } else {
      remainingLogistics.push(entry);
    }
  }

  // Check expenses: auto-accept if payer matches sender, or no payer specified (receipt forwarding)
  const autoExpenses = [];
  const remainingExpenses = [];

  for (const expense of (parsedData.expenses || [])) {
    const payerName = (expense.payer_name || '').toLowerCase().trim();
    const payerMemberId = expense.payer_member_id;

    // Auto-accept if: explicit member_id match, fuzzy name match to sender, or no payer specified (assume sender paid)
    const matchesSender = payerMemberId === senderMemberId ||
      (!payerName && !payerMemberId) ||
      (payerName && senderName && (senderName.includes(payerName) || payerName.includes(senderName))) ||
      (payerName && senderEmail && senderEmail.includes(payerName));

    if (matchesSender) {
      autoExpenses.push(expense);
    } else {
      remainingExpenses.push(expense);
    }
  }

  // Never auto-accept these
  const remainingNewTravelers = parsedData.new_travelers || [];
  const remainingEvents = parsedData.events || [];

  // Nothing to auto-apply?
  if (autoMemberUpdates.length === 0 && autoLogistics.length === 0 && autoExpenses.length === 0) {
    return { autoApplied: false, fullyApplied: false, summary: null, appliedItems: null, remainingItems: null };
  }

  // Apply member updates (stay dates)
  for (const update of autoMemberUpdates) {
    const updateData = {};
    if (update.stay_start) updateData.stay_start = update.stay_start;
    if (update.stay_end) updateData.stay_end = update.stay_end;
    if (update.staying_at) updateData.staying_at = update.staying_at;

    if (Object.keys(updateData).length > 0) {
      const { error } = await supabase
        .from('trip_members')
        .update(updateData)
        .eq('id', update.member_id)
        .eq('trip_id', tripId);

      if (error) {
        console.error(`Auto-accept: failed to update member ${update.member_id}:`, error);
      } else {
        appliedItems.push({ item_type: 'member_update', ...update });
        const dateStr = update.stay_start && update.stay_end
          ? `${update.stay_start} to ${update.stay_end}`
          : update.stay_start ? `arriving ${update.stay_start}`
          : update.stay_end ? `departing ${update.stay_end}`
          : update.staying_at ? `staying at ${update.staying_at}`
          : 'details updated';
        summaryParts.push(`dates updated (${dateStr})`);
      }
    }
  }

  // Apply logistics
  for (const entry of autoLogistics) {
    const { error } = await supabase.from('logistics').insert({
      trip_id: tripId,
      user_id: senderMember.user_id,
      type: entry.type || 'other',
      title: entry.title || `${entry.type || 'Item'} for ${entry.person_name}`,
      details: entry.details || {},
      start_time: entry.start_time || null,
      end_time: entry.end_time || null,
      notes: entry.notes || null,
    });

    if (error) {
      console.error(`Auto-accept: failed to insert logistics "${entry.title}":`, error);
    } else {
      appliedItems.push({ item_type: 'logistics', ...entry });
      summaryParts.push(entry.title || `${entry.type} added`);
    }
  }

  // Apply expenses
  for (const expense of autoExpenses) {
    const validCategories = ['food','drinks','transport','accommodation','activities','groceries','supplies','other'];
    const category = validCategories.includes(expense.category) ? expense.category : 'other';

    const { error } = await supabase.from('expenses').insert({
      trip_id: tripId,
      paid_by_member_id: senderMemberId,
      description: expense.description || expense.vendor || 'Expense',
      vendor: expense.vendor || null,
      amount: expense.amount,
      currency: expense.currency || 'USD',
      expense_date: expense.expense_date || new Date().toISOString().slice(0, 10),
      category,
      notes: expense.notes || null,
      source_inbound_email_id: inboundEmailId,
    });

    if (error) {
      console.error(`Auto-accept: failed to insert expense "${expense.description}":`, error);
    } else {
      appliedItems.push({ item_type: 'expense', ...expense });
      const amountStr = expense.amount ? `$${expense.amount}` : '';
      summaryParts.push(`${expense.vendor || expense.description || 'expense'}${amountStr ? ` (${amountStr})` : ''} added`);
    }
  }

  if (appliedItems.length === 0) {
    return { autoApplied: false, fullyApplied: false, summary: null, appliedItems: null, remainingItems: null };
  }

  // Determine if everything was handled
  const hasRemaining = remainingMemberUpdates.length > 0 ||
    remainingNewTravelers.length > 0 ||
    remainingLogistics.length > 0 ||
    remainingEvents.length > 0 ||
    remainingExpenses.length > 0;

  const fullyApplied = !hasRemaining;
  const summary = summaryParts.join(', ');

  // Update the inbound email record
  const emailUpdate = {
    auto_applied_at: new Date().toISOString(),
    auto_applied_items: appliedItems,
  };
  if (fullyApplied) {
    emailUpdate.status = 'applied';
  } else {
    // Update parsed_data to only contain remaining items so owner doesn't re-apply
    emailUpdate.parsed_data = {
      ...parsedData,
      member_updates: remainingMemberUpdates,
      logistics: remainingLogistics,
      new_travelers: remainingNewTravelers,
      events: remainingEvents,
      expenses: remainingExpenses,
    };
  }

  const { error: updateError } = await supabase
    .from('inbound_emails')
    .update(emailUpdate)
    .eq('id', inboundEmailId);

  if (updateError) {
    console.error('Auto-accept: failed to update inbound email record:', updateError);
  }

  return {
    autoApplied: true,
    fullyApplied,
    summary,
    appliedItems,
    remainingItems: hasRemaining ? {
      member_updates: remainingMemberUpdates,
      new_travelers: remainingNewTravelers,
      logistics: remainingLogistics,
      events: remainingEvents,
      expenses: remainingExpenses,
    } : null,
  };
}
