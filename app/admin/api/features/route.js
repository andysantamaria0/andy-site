import { createClient } from '../../../../lib/supabase/server';
import { NextResponse } from 'next/server';

export async function PATCH(request) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('email', user.email)
    .single();

  if (profile?.role !== 'super_admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { featureId, field, value, role } = await request.json();

  if (field === 'enabled') {
    const { error } = await supabase
      .from('features')
      .update({ enabled: value, updated_at: new Date().toISOString() })
      .eq('id', featureId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  } else if (field === 'role_permission') {
    const { error } = await supabase
      .from('feature_role_permissions')
      .update({ enabled: value })
      .eq('feature_id', featureId)
      .eq('role', role);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  } else {
    return NextResponse.json({ error: 'Invalid field' }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
