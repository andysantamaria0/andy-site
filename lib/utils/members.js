const MEMBER_COLORS = ['#4A35D7', '#FF7D73', '#DFB288', '#2D8659', '#4285F4', '#E040FB', '#FF6D00', '#00BFA5'];

/**
 * Get display info for a trip member, handling both registered (with profiles) and manual members.
 */
export function getMemberDisplayInfo(member) {
  const profile = member.profiles;

  if (profile) {
    return {
      name: profile.display_name || profile.email || 'Unknown',
      email: profile.email || null,
      avatarUrl: profile.avatar_url || null,
      color: member.color || MEMBER_COLORS[0],
    };
  }

  // Manual member — use direct fields
  return {
    name: member.display_name || member.email || 'Unknown',
    email: member.email || null,
    avatarUrl: null,
    color: member.color || MEMBER_COLORS[0],
  };
}

/**
 * Get the next unused color from the palette for a new member.
 */
export function getNextColor(existingMembers) {
  const usedColors = new Set((existingMembers || []).map((m) => m.color));
  return MEMBER_COLORS.find((c) => !usedColors.has(c)) || MEMBER_COLORS[existingMembers.length % MEMBER_COLORS.length];
}

export { MEMBER_COLORS };
