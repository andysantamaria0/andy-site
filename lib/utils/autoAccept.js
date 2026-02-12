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

    // Same fuzzy matching as apply/route.js
    const matchesSender = senderName.includes(personName) || personName.includes(senderName) || senderEmail.includes(personName);

    // Also verify the matched member is actually the sender by doing full member lookup
    if (matchesSender && senderMember.user_id) {
      autoLogistics.push(entry);
    } else {
      remainingLogistics.push(entry);
    }
  }

  // Never auto-accept these
  const remainingNewTravelers = parsedData.new_travelers || [];
  const remainingEvents = parsedData.events || [];

  // Nothing to auto-apply?
  if (autoMemberUpdates.length === 0 && autoLogistics.length === 0) {
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

      if (!error) {
        appliedItems.push({ type: 'member_update', ...update });
        const dateStr = update.stay_start && update.stay_end
          ? `${update.stay_start} to ${update.stay_end}`
          : update.stay_start ? `arriving ${update.stay_start}` : `departing ${update.stay_end}`;
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

    if (!error) {
      appliedItems.push({ type: 'logistics', ...entry });
      summaryParts.push(entry.title || `${entry.type} added`);
    }
  }

  if (appliedItems.length === 0) {
    return { autoApplied: false, fullyApplied: false, summary: null, appliedItems: null, remainingItems: null };
  }

  // Determine if everything was handled
  const hasRemaining = remainingMemberUpdates.length > 0 ||
    remainingNewTravelers.length > 0 ||
    remainingLogistics.length > 0 ||
    remainingEvents.length > 0;

  const fullyApplied = !hasRemaining;
  const summary = summaryParts.join(', ');

  // Update the inbound email record
  const updateData = {
    auto_applied_at: new Date().toISOString(),
    auto_applied_items: appliedItems,
  };
  if (fullyApplied) {
    updateData.status = 'applied';
  }

  await supabase
    .from('inbound_emails')
    .update(updateData)
    .eq('id', inboundEmailId);

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
    } : null,
  };
}
