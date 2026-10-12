const supabase = require('../config/supabase');

async function checkDb() {
  if (!supabase) {
    console.log('No supabase client configured.');
    return;
  }

  const { data: doctors, error: dErr } = await supabase.from('doctors').select('id, name, email, firebase_uid');
  console.log('DOCTORS (' + (doctors?.length || 0) + '):', doctors);

  const { data: patients, error: pErr } = await supabase.from('patients').select('id, name, patient_code, doctor_id, created_at');
  console.log('PATIENTS TOTAL (' + (patients?.length || 0) + ')');
  if (patients && patients.length > 0) {
    console.log('Sample patients (first 10):', patients.slice(0, 10));
    const nameCounts = {};
    patients.forEach(p => {
      nameCounts[p.name] = (nameCounts[p.name] || 0) + 1;
    });
    console.log('Name counts:', nameCounts);
  }

  const { data: assessments, error: aErr } = await supabase.from('assessments').select('id, doctor_id, patient_id, status, started_at');
  console.log('ASSESSMENTS TOTAL (' + (assessments?.length || 0) + ')');
  if (assessments && assessments.length > 0) {
    console.log('Sample assessments (first 10):', assessments.slice(0, 10));
  }
}

checkDb().then(() => process.exit(0)).catch(err => {
  console.error(err);
  process.exit(1);
});
