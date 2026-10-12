const supabase = require('../config/supabase');

const DEMO_PATIENT_NAMES = [
  'Ananya Sharma',
  'Meena Kumari',
  'Patient of Doctor A',
  'Patient of Doctor B',
  'Lakshmi Bai',
  'Kavita Roy',
  'Prachi Manikpuri',
  'sss',
  'riya',
  'aaaaaaaaaaaaaaaa',
  'Shivani',
  'Ansuli',
  'Tanu',
  'Ranu',
  'Suchi',
  'Crfc'
];

async function runCleanup() {
  console.log('--- Starting Safe Controlled Demo Data Cleanup ---');

  if (!supabase) {
    console.error('Supabase client is not configured!');
    process.exit(1);
  }

  // 1. Fetch demo patients
  const { data: demoPatients, error: fetchErr } = await supabase
    .from('patients')
    .select('id, name, patient_code');

  if (fetchErr) {
    console.error('Error querying patients:', fetchErr);
    process.exit(1);
  }

  const toDelete = (demoPatients || []).filter(p => {
    const isDemoName = DEMO_PATIENT_NAMES.includes(p.name);
    const isTestCode = p.patient_code.startsWith('PT-TRIAGE-') || p.patient_code.startsWith('PT-VAL-') || p.patient_code.startsWith('PT-DEMO-');
    const isGenericTest = p.name.toLowerCase().includes('demo') || p.name.toLowerCase().includes('test');
    return isDemoName || isTestCode || isGenericTest;
  });

  console.log(`Found ${toDelete.length} demo/test patients out of ${demoPatients?.length || 0} total patients.`);

  if (toDelete.length > 0) {
    const deleteIds = toDelete.map(p => p.id);

    // Delete in batches of 50
    for (let i = 0; i < deleteIds.length; i += 50) {
      const batch = deleteIds.slice(i, i + 50);
      const { error: delErr } = await supabase
        .from('patients')
        .delete()
        .in('id', batch);

      if (delErr) {
        console.error('Error deleting batch of patients:', delErr);
      } else {
        console.log(`Deleted batch of ${batch.length} demo patients.`);
      }
    }
  }

  // 2. Check for orphaned assessments
  const { data: remainingPatients } = await supabase.from('patients').select('id');
  const validPatientIds = new Set((remainingPatients || []).map(p => p.id));

  const { data: allAssessments } = await supabase.from('assessments').select('id, patient_id');
  const orphanedAssessments = (allAssessments || []).filter(a => !validPatientIds.has(a.patient_id));

  if (orphanedAssessments.length > 0) {
    console.log(`Found ${orphanedAssessments.length} orphaned assessments. Cleaning up...`);
    const orphanIds = orphanedAssessments.map(a => a.id);
    for (let i = 0; i < orphanIds.length; i += 50) {
      const batch = orphanIds.slice(i, i + 50);
      await supabase.from('assessments').delete().in('id', batch);
    }
    console.log(`Cleaned up orphaned assessments.`);
  }

  // 3. Clean up storage files in 'patient-photos'
  try {
    const { data: storageFiles, error: stErr } = await supabase.storage.from('patient-photos').list();
    if (!stErr && storageFiles && storageFiles.length > 0) {
      const fileNames = storageFiles.map(f => f.name);
      console.log(`Found ${fileNames.length} files in patient-photos storage.`);
      const { data: remPatients } = await supabase.from('patients').select('id');
      const liveIds = new Set((remPatients || []).map(p => p.id));
      const filesToRemove = fileNames.filter(f => !liveIds.has(f));
      if (filesToRemove.length > 0) {
        console.log(`Removing ${filesToRemove.length} orphaned photo records from storage...`);
        await supabase.storage.from('patient-photos').remove(filesToRemove);
      }
    }
  } catch (stEx) {
    console.warn('Storage cleanup notice:', stEx.message);
  }

  // 4. Verification
  const { count: finalPatients } = await supabase.from('patients').select('*', { count: 'exact', head: true });
  const { count: finalAssessments } = await supabase.from('assessments').select('*', { count: 'exact', head: true });
  const { count: finalDoctors } = await supabase.from('doctors').select('*', { count: 'exact', head: true });
  const { count: finalAdmins } = await supabase.from('admins').select('*', { count: 'exact', head: true });
  const { count: finalQuestions } = await supabase.from('questions').select('*', { count: 'exact', head: true });

  console.log('\n--- Final Verification Summary ---');
  console.log('Patients in DB:', finalPatients);
  console.log('Assessments in DB:', finalAssessments);
  console.log('Doctors in DB (preserved):', finalDoctors);
  console.log('Admins in DB (preserved):', finalAdmins);
  console.log('Questions in DB (preserved):', finalQuestions);
  console.log('Cleanup completed successfully!');
}

runCleanup().then(() => process.exit(0)).catch(err => {
  console.error(err);
  process.exit(1);
});
