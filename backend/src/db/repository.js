const crypto = require('crypto');
const supabase = require('../config/supabase');
const { allQuestions } = require('./seedQuestions');

// In-memory fallback stores for offline/local testing
const memoryStore = {
  doctors: [
    {
      id: 'd1111111-1111-1111-1111-111111111111',
      firebase_uid: 'doc_demo_firebase_uid_1',
      name: 'Dr. Priya Sharma',
      email: 'doctor@breastcare.ai',
      phone: '+91 98765 43210',
      tablet_id: 'TABLET-CLINIC-01',
      status: 'ACTIVE',
      created_at: new Date('2026-01-01T00:00:00Z').toISOString(),
      updated_at: new Date('2026-01-01T00:00:00Z').toISOString()
    }
  ],
  admins: [
    {
      id: 'a1111111-1111-1111-1111-111111111111',
      firebase_uid: 'admin_demo_firebase_uid_1',
      name: 'Super Admin',
      email: 'admin@breastcare.ai',
      status: 'ACTIVE',
      created_at: new Date('2026-01-01T00:00:00Z').toISOString(),
      updated_at: new Date('2026-01-01T00:00:00Z').toISOString()
    }
  ],
  patients: [
    {
      id: 'p1111111-1111-1111-1111-111111111111',
      patient_code: 'PT-2026-001',
      name: 'Sunita Devi',
      age: 48,
      gender: 'Female',
      phone: '+91 98111 22233',
      face_photo_url: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ],
  doctor_patient: [
    {
      id: 'dp111111-1111-1111-1111-111111111111',
      doctor_id: 'd1111111-1111-1111-1111-111111111111',
      patient_id: 'p1111111-1111-1111-1111-111111111111',
      created_at: new Date().toISOString()
    }
  ],
  questions: [...allQuestions],
  assessments: [],
  answers: []
};

// Helper: generate UUID
function generateId() {
  return crypto.randomUUID ? crypto.randomUUID() : crypto.randomBytes(16).toString('hex');
}

class Repository {
  // DOCTORS
  async findDoctorByFirebaseUid(firebaseUid) {
    if (supabase) {
      const { data, error } = await supabase
        .from('doctors')
        .select('*')
        .eq('firebase_uid', firebaseUid)
        .single();
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    }
    return memoryStore.doctors.find(d => d.firebase_uid === firebaseUid) || null;
  }

  async findDoctorById(id) {
    if (supabase) {
      const { data, error } = await supabase
        .from('doctors')
        .select('*')
        .eq('id', id)
        .single();
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    }
    return memoryStore.doctors.find(d => d.id === id) || null;
  }

  async getAllDoctors() {
    if (supabase) {
      const { data, error } = await supabase.from('doctors').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    }
    return [...memoryStore.doctors];
  }

  async createDoctor(doc) {
    const newDoc = {
      id: doc.id || generateId(),
      firebase_uid: doc.firebase_uid,
      name: doc.name,
      email: doc.email,
      phone: doc.phone || null,
      tablet_id: doc.tablet_id || null,
      status: doc.status || 'ACTIVE',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    if (supabase) {
      const { data: existing } = await supabase
        .from('doctors')
        .select('*')
        .or(`email.eq.${doc.email},firebase_uid.eq.${doc.firebase_uid}`)
        .maybeSingle();

      if (existing) {
        const { data: updated, error: updateErr } = await supabase
          .from('doctors')
          .update({
            firebase_uid: doc.firebase_uid,
            name: doc.name || existing.name,
            tablet_id: doc.tablet_id || existing.tablet_id,
            updated_at: new Date().toISOString()
          })
          .eq('id', existing.id)
          .select()
          .single();
        if (updateErr) throw updateErr;
        return updated;
      }

      const { data, error } = await supabase.from('doctors').insert([newDoc]).select().single();
      if (error) throw error;
      return data;
    }
    const existingIdx = memoryStore.doctors.findIndex(d => d.email === doc.email || d.firebase_uid === doc.firebase_uid);
    if (existingIdx !== -1) {
      memoryStore.doctors[existingIdx] = { ...memoryStore.doctors[existingIdx], firebase_uid: doc.firebase_uid };
      return memoryStore.doctors[existingIdx];
    }
    memoryStore.doctors.push(newDoc);
    return newDoc;
  }

  // ADMINS
  async findAdminByFirebaseUid(firebaseUid) {
    if (supabase) {
      const { data, error } = await supabase
        .from('admins')
        .select('*')
        .eq('firebase_uid', firebaseUid)
        .single();
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    }
    return memoryStore.admins.find(a => a.firebase_uid === firebaseUid) || null;
  }

  async getAllAdmins() {
    if (supabase) {
      const { data, error } = await supabase.from('admins').select('*');
      if (error) throw error;
      return data;
    }
    return [...memoryStore.admins];
  }

  async createAdmin(adminData) {
    const newAdmin = {
      id: adminData.id || generateId(),
      firebase_uid: adminData.firebase_uid,
      name: adminData.name,
      email: adminData.email,
      status: adminData.status || 'ACTIVE',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    if (supabase) {
      const { data: existing } = await supabase
        .from('admins')
        .select('*')
        .or(`email.eq.${adminData.email},firebase_uid.eq.${adminData.firebase_uid}`)
        .maybeSingle();

      if (existing) {
        const { data: updated, error: updateErr } = await supabase
          .from('admins')
          .update({
            firebase_uid: adminData.firebase_uid,
            name: adminData.name || existing.name,
            updated_at: new Date().toISOString()
          })
          .eq('id', existing.id)
          .select()
          .single();
        if (updateErr) throw updateErr;
        return updated;
      }

      const { data, error } = await supabase.from('admins').insert([newAdmin]).select().single();
      if (error) throw error;
      return data;
    }
    const existingIdx = memoryStore.admins.findIndex(a => a.email === adminData.email || a.firebase_uid === adminData.firebase_uid);
    if (existingIdx !== -1) {
      memoryStore.admins[existingIdx] = { ...memoryStore.admins[existingIdx], firebase_uid: adminData.firebase_uid };
      return memoryStore.admins[existingIdx];
    }
    memoryStore.admins.push(newAdmin);
    return newAdmin;
  }

  // PATIENTS
  async getPatientsForDoctor(doctorId) {
    if (supabase) {
      const { data, error } = await supabase
        .from('doctor_patient')
        .select('patient_id, patients (*)')
        .eq('doctor_id', doctorId);
      if (error) throw error;
      return (data || []).map(row => row.patients).filter(Boolean);
    }
    const patientIds = memoryStore.doctor_patient
      .filter(dp => dp.doctor_id === doctorId)
      .map(dp => dp.patient_id);
    return memoryStore.patients.filter(p => patientIds.includes(p.id));
  }

  async getAllPatients() {
    if (supabase) {
      const { data, error } = await supabase.from('patients').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    }
    return [...memoryStore.patients];
  }

  async getPatientById(id) {
    if (supabase) {
      const { data, error } = await supabase.from('patients').select('*').eq('id', id).single();
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    }
    return memoryStore.patients.find(p => p.id === id) || null;
  }

  async createPatient(patientData, doctorId) {
    const patientId = generateId();
    const newPatient = {
      id: patientId,
      patient_code: patientData.patient_code || `PT-${Date.now().toString().slice(-6)}`,
      name: patientData.name,
      age: parseInt(patientData.age, 10),
      gender: patientData.gender || 'Female',
      phone: patientData.phone || null,
      face_photo_url: patientData.face_photo_url || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    if (supabase) {
      const { data, error } = await supabase.from('patients').insert([newPatient]).select().single();
      if (error) throw error;
      if (doctorId) {
        await supabase.from('doctor_patient').insert([{
          doctor_id: doctorId,
          patient_id: data.id,
          created_at: new Date().toISOString()
        }]);
      }
      return data;
    }

    memoryStore.patients.push(newPatient);
    if (doctorId) {
      memoryStore.doctor_patient.push({
        id: generateId(),
        doctor_id: doctorId,
        patient_id: patientId,
        created_at: new Date().toISOString()
      });
    }
    return newPatient;
  }

  async updatePatient(id, updateData) {
    const updatedFields = {
      ...updateData,
      updated_at: new Date().toISOString()
    };
    if (supabase) {
      const { data, error } = await supabase
        .from('patients')
        .update(updatedFields)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    }
    const idx = memoryStore.patients.findIndex(p => p.id === id);
    if (idx !== -1) {
      memoryStore.patients[idx] = { ...memoryStore.patients[idx], ...updatedFields };
      return memoryStore.patients[idx];
    }
    return null;
  }

  // QUESTIONS
  async getAllQuestions() {
    if (supabase) {
      const { data, error } = await supabase
        .from('questions')
        .select('*')
        .eq('is_active', true)
        .order('phase', { ascending: true })
        .order('sequence', { ascending: true });
      if (error) throw error;
      return data;
    }
    return memoryStore.questions.filter(q => q.is_active);
  }

  async getQuestionsByPhase(phase) {
    if (supabase) {
      const { data, error } = await supabase
        .from('questions')
        .select('*')
        .eq('phase', phase)
        .eq('is_active', true)
        .order('sequence', { ascending: true });
      if (error) throw error;
      return data;
    }
    return memoryStore.questions.filter(q => q.phase === phase && q.is_active);
  }

  async getQuestionById(id) {
    if (supabase) {
      const { data, error } = await supabase.from('questions').select('*').eq('id', id).single();
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    }
    return memoryStore.questions.find(q => q.id === id) || null;
  }

  // ASSESSMENTS
  formatAssessment(a) {
    if (!a) return a;
    const review = (a.risk_analysis && a.risk_analysis.review) || {};
    return {
      ...a,
      reviewed_by: a.reviewed_by !== undefined && a.reviewed_by !== null ? a.reviewed_by : (review.reviewed_by || null),
      reviewed_at: a.reviewed_at !== undefined && a.reviewed_at !== null ? a.reviewed_at : (review.reviewed_at || null),
      doctor_note: a.doctor_note !== undefined && a.doctor_note !== null ? a.doctor_note : (review.doctor_note || null),
      reassessment_reason: a.reassessment_reason !== undefined && a.reassessment_reason !== null ? a.reassessment_reason : (review.reassessment_reason || null),
    };
  }

  async getAssessmentsForDoctor(doctorId) {
    if (supabase) {
      const { data, error } = await supabase
        .from('assessments')
        .select('*, patients (*)')
        .eq('doctor_id', doctorId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []).map(a => this.formatAssessment(a));
    }
    return memoryStore.assessments
      .filter(a => a.doctor_id === doctorId)
      .map(a => this.formatAssessment({
        ...a,
        patient: memoryStore.patients.find(p => p.id === a.patient_id) || null
      }));
  }

  async getAllAssessments() {
    if (supabase) {
      const { data, error } = await supabase
        .from('assessments')
        .select('*, doctors (name, email, tablet_id), patients (name, patient_code, age, gender)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []).map(a => this.formatAssessment(a));
    }
    return memoryStore.assessments.map(a => this.formatAssessment({
      ...a,
      doctor: memoryStore.doctors.find(d => d.id === a.doctor_id) || null,
      patient: memoryStore.patients.find(p => p.id === a.patient_id) || null
    }));
  }

  async getAssessmentById(id) {
    if (supabase) {
      const { data, error } = await supabase
        .from('assessments')
        .select('*, doctors (*), patients (*)')
        .eq('id', id)
        .single();
      if (error && error.code !== 'PGRST116') throw error;
      return this.formatAssessment(data);
    }
    const a = memoryStore.assessments.find(item => item.id === id);
    if (!a) return null;
    return this.formatAssessment({
      ...a,
      doctor: memoryStore.doctors.find(d => d.id === a.doctor_id) || null,
      patient: memoryStore.patients.find(p => p.id === a.patient_id) || null
    });
  }

  async createAssessment(assessmentData) {
    const newAssessment = {
      id: generateId(),
      doctor_id: assessmentData.doctor_id,
      patient_id: assessmentData.patient_id,
      status: assessmentData.status || 'IN_PROGRESS',
      risk_profile: assessmentData.risk_profile || {},
      risk_analysis: assessmentData.risk_analysis || {},
      started_at: new Date().toISOString(),
      completed_at: null,
      reviewed_by: assessmentData.reviewed_by || null,
      reviewed_at: assessmentData.reviewed_at || null,
      doctor_note: assessmentData.doctor_note || null,
      reassessment_reason: assessmentData.reassessment_reason || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    if (supabase) {
      try {
        const { data, error } = await supabase.from('assessments').insert([newAssessment]).select().single();
        if (!error && data) return this.formatAssessment(data);
        if (error && error.code === 'PGRST204') {
          const fallback = { ...newAssessment };
          delete fallback.reviewed_by;
          delete fallback.reviewed_at;
          delete fallback.doctor_note;
          delete fallback.reassessment_reason;
          const { data: fbData, error: fbError } = await supabase.from('assessments').insert([fallback]).select().single();
          if (fbError) throw fbError;
          return this.formatAssessment(fbData);
        }
        if (error) throw error;
      } catch (err) {
        throw err;
      }
    }
    memoryStore.assessments.push(newAssessment);
    return this.formatAssessment(newAssessment);
  }

  async updateAssessment(id, updateData) {
    const updated = {
      ...updateData,
      updated_at: new Date().toISOString()
    };

    // If review fields are provided, ensure risk_analysis.review also stores them
    if (
      updated.reviewed_by !== undefined ||
      updated.reviewed_at !== undefined ||
      updated.doctor_note !== undefined ||
      updated.reassessment_reason !== undefined
    ) {
      let currentRiskAnalysis = updated.risk_analysis;
      if (!currentRiskAnalysis) {
        const existing = await this.getAssessmentById(id);
        currentRiskAnalysis = (existing && existing.risk_analysis) || {};
      }
      updated.risk_analysis = {
        ...currentRiskAnalysis,
        review: {
          ...(currentRiskAnalysis.review || {}),
          ...(updated.reviewed_by !== undefined ? { reviewed_by: updated.reviewed_by } : {}),
          ...(updated.reviewed_at !== undefined ? { reviewed_at: updated.reviewed_at } : {}),
          ...(updated.doctor_note !== undefined ? { doctor_note: updated.doctor_note } : {}),
          ...(updated.reassessment_reason !== undefined ? { reassessment_reason: updated.reassessment_reason } : {})
        }
      };
    }

    if (supabase) {
      try {
        const { data, error } = await supabase.from('assessments').update(updated).eq('id', id).select().single();
        if (!error && data) return this.formatAssessment(data);
        if (error && error.code === 'PGRST204') {
          const fallbackData = { ...updated };
          delete fallbackData.reviewed_by;
          delete fallbackData.reviewed_at;
          delete fallbackData.doctor_note;
          delete fallbackData.reassessment_reason;
          const { data: fbData, error: fbError } = await supabase.from('assessments').update(fallbackData).eq('id', id).select().single();
          if (fbError) throw fbError;
          return this.formatAssessment({
            ...fbData,
            reviewed_by: updated.reviewed_by !== undefined ? updated.reviewed_by : null,
            reviewed_at: updated.reviewed_at !== undefined ? updated.reviewed_at : null,
            doctor_note: updated.doctor_note !== undefined ? updated.doctor_note : null,
            reassessment_reason: updated.reassessment_reason !== undefined ? updated.reassessment_reason : null,
          });
        }
        if (error) throw error;
      } catch (err) {
        throw err;
      }
    }
    const idx = memoryStore.assessments.findIndex(a => a.id === id);
    if (idx !== -1) {
      memoryStore.assessments[idx] = { ...memoryStore.assessments[idx], ...updated };
      return this.formatAssessment(memoryStore.assessments[idx]);
    }
    return null;
  }

  // ANSWERS
  async saveAnswers(answersArray) {
    const records = answersArray.map(ans => ({
      id: generateId(),
      assessment_id: ans.assessment_id,
      question_id: ans.question_id,
      question: ans.question,
      answer: typeof ans.answer === 'object' ? JSON.stringify(ans.answer) : String(ans.answer),
      answer_type: ans.answer_type || 'BOOLEAN',
      answered_at: ans.answered_at || new Date().toISOString(),
      created_at: new Date().toISOString()
    }));

    if (supabase) {
      const { data, error } = await supabase.from('answers').insert(records).select();
      if (error) throw error;
      return data;
    }
    memoryStore.answers.push(...records);
    return records;
  }

  async getAnswersForAssessment(assessmentId) {
    if (supabase) {
      const { data, error } = await supabase
        .from('answers')
        .select('*')
        .eq('assessment_id', assessmentId)
        .order('answered_at', { ascending: true });
      if (error) throw error;
      return data;
    }
    return memoryStore.answers.filter(ans => ans.assessment_id === assessmentId);
  }

  // PHOTO STORAGE
  async savePatientPhoto(patientId, fileBuffer, fileName, mimeType) {
    const storageBucket = process.env.SUPABASE_STORAGE_BUCKET || 'patient-photos';
    const filePath = `${patientId}/${Date.now()}_${fileName}`;

    if (supabase) {
      const { error: uploadError } = await supabase.storage
        .from(storageBucket)
        .upload(filePath, fileBuffer, { contentType: mimeType, upsert: true });

      if (uploadError) throw uploadError;

      // Create signed URL valid for 7 days
      const { data: signedData, error: signError } = await supabase.storage
        .from(storageBucket)
        .createSignedUrl(filePath, 60 * 60 * 24 * 7);

      if (signError) throw signError;
      return signedData.signedUrl;
    }

    // Local / In-memory data URL fallback
    const base64Data = fileBuffer.toString('base64');
    return `data:${mimeType};base64,${base64Data}`;
  }
}

module.exports = new Repository();
