const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const questionsData = require('./symptoms_questions.json');

// Phase 0: Baseline Risk Profile Questions
const baselineQuestions = [
  {
    id: 'brm_age',
    phase: 0,
    category: 'Baseline Risk Profile',
    question: 'What is the patient\'s age?',
    question_type: 'SINGLE_CHOICE',
    options: ['Under 30', '30-39', '40-49', '50-59', '60 or older'],
    sequence: 1,
    is_active: true
  },
  {
    id: 'brm_family_history',
    phase: 0,
    category: 'Baseline Risk Profile',
    question: 'Is there a family history of breast or ovarian cancer (Mother, Sister, Daughter)?',
    question_type: 'SINGLE_CHOICE',
    options: ['Yes (First-degree relative: Mother/Sister/Daughter)', 'Yes (Second-degree relative: Aunt/Grandmother)', 'No / Unknown'],
    sequence: 2,
    is_active: true
  },
  {
    id: 'brm_breastfeeding',
    phase: 0,
    category: 'Baseline Risk Profile',
    question: 'Has the patient ever breastfed?',
    question_type: 'SINGLE_CHOICE',
    options: ['Yes (> 1 year cumulative)', 'Yes (< 1 year cumulative)', 'Never breastfed / Nulliparous'],
    sequence: 3,
    is_active: true
  },
  {
    id: 'brm_contraceptives',
    phase: 0,
    category: 'Baseline Risk Profile',
    question: 'Has the patient used hormonal contraceptives / HRT for more than 5 years?',
    question_type: 'SINGLE_CHOICE',
    options: ['Yes (> 5 years)', 'Yes (< 5 years)', 'Never used'],
    sequence: 4,
    is_active: true
  },
  {
    id: 'brm_parity',
    phase: 0,
    category: 'Baseline Risk Profile',
    question: 'Patient parity (number of full-term pregnancies)?',
    question_type: 'SINGLE_CHOICE',
    options: ['0 (Nulliparous)', '1 or 2 children', '3 or more children'],
    sequence: 5,
    is_active: true
  },
  {
    id: 'brm_menarche',
    phase: 0,
    category: 'Baseline Risk Profile',
    question: 'Age at first menstruation (menarche)?',
    question_type: 'SINGLE_CHOICE',
    options: ['Under 12 years (Early menarche)', '12-14 years', '15 years or older'],
    sequence: 6,
    is_active: true
  },
  {
    id: 'brm_biopsy',
    phase: 0,
    category: 'Baseline Risk Profile',
    question: 'Has the patient previously undergone a breast biopsy or had benign breast disease?',
    question_type: 'SINGLE_CHOICE',
    options: ['Yes, with atypia', 'Yes, benign without atypia', 'No previous biopsy'],
    sequence: 7,
    is_active: true
  },
  {
    id: 'brm_menopause',
    phase: 0,
    category: 'Baseline Risk Profile',
    question: 'Menopausal status?',
    question_type: 'SINGLE_CHOICE',
    options: ['Premenopausal', 'Perimenopausal', 'Postmenopausal (Age 55+)', 'Postmenopausal (Under 55)'],
    sequence: 8,
    is_active: true
  }
];

// Build full questions list from phases 1, 2, 3
const symptomQuestions = questionsData.map((categoryGroup, index) => {
  return {
    id: `sym_phase${categoryGroup.phase}_cat${index + 1}`,
    phase: categoryGroup.phase,
    category: categoryGroup.category,
    question: `Does the patient exhibit any ${categoryGroup.category}?`,
    question_type: 'CHECKLIST',
    options: categoryGroup.options.map(opt => ({
      label: opt.label,
      converted_name: opt.converted_name,
      weight: opt.weight,
      relevance: opt.relevance
    })),
    sequence: index + 9,
    is_active: true
  };
});

const allQuestions = [...baselineQuestions, ...symptomQuestions];

// Direct execution function to seed real Supabase database
async function seedToSupabase() {
  const supabase = require('../config/supabase');
  if (!supabase) {
    console.log('[Supabase Seed] SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are not configured in .env.');
    console.log('[Supabase Seed] Questions are loaded dynamically via in-memory store for development/testing.');
    console.log('[Supabase Seed] To seed real Supabase database, set credentials in backend/.env and re-run.');
    return;
  }

  console.log(`[Supabase Seed] Seeding ${allQuestions.length} questions into Supabase...`);
  try {
    const { data, error } = await supabase
      .from('questions')
      .upsert(allQuestions, { onConflict: 'id' })
      .select('id');

    if (error) {
      console.error('[Supabase Seed] Error inserting questions:', error.message);
      process.exit(1);
    }

    console.log(`[Supabase Seed] Successfully seeded ${data.length} questions into Supabase!`);

    // Ensure Demo Doctor exists in doctors table
    const { data: existingDoc } = await supabase
      .from('doctors')
      .select('id')
      .eq('firebase_uid', 'doc_demo_firebase_uid_1')
      .maybeSingle();

    if (!existingDoc) {
      const { error: docInsertErr } = await supabase.from('doctors').insert([{
        id: 'd1111111-1111-1111-1111-111111111111',
        firebase_uid: 'doc_demo_firebase_uid_1',
        name: 'Dr. Priya Sharma',
        email: 'doctor@breastcare.ai',
        phone: '+91 98765 43210',
        tablet_id: 'TABLET-CLINIC-01',
        status: 'ACTIVE'
      }]);
      if (docInsertErr) console.warn('[Supabase Seed] Doctor insert note:', docInsertErr.message);
      else console.log('[Supabase Seed] Demo Doctor provisioned successfully.');
    } else {
      console.log('[Supabase Seed] Demo Doctor already present in database.');
    }

    // Ensure Demo Admin exists in admins table
    const { data: existingAdmin } = await supabase
      .from('admins')
      .select('id')
      .eq('firebase_uid', 'admin_demo_firebase_uid_1')
      .maybeSingle();

    if (!existingAdmin) {
      const { error: adminInsertErr } = await supabase.from('admins').insert([{
        id: 'a1111111-1111-1111-1111-111111111111',
        firebase_uid: 'admin_demo_firebase_uid_1',
        name: 'Super Admin',
        email: 'admin@breastcare.ai',
        status: 'ACTIVE'
      }]);
      if (adminInsertErr) console.warn('[Supabase Seed] Admin insert note:', adminInsertErr.message);
      else console.log('[Supabase Seed] Demo Admin provisioned successfully.');
    } else {
      console.log('[Supabase Seed] Demo Admin already present in database.');
    }

  } catch (err) {
    console.error('[Supabase Seed] Exception while seeding:', err.message);
    process.exit(1);
  }
}

if (require.main === module) {
  seedToSupabase().then(() => process.exit(0));
}

module.exports = {
  baselineQuestions,
  symptomQuestions,
  allQuestions,
  seedToSupabase
};
