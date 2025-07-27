import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Contact form submission
export async function submitContactForm(formData) {
  try {
    const { data, error } = await supabase
      .from('contacts')
      .insert([
        {
          name: formData.name,
          email: formData.email,
          phone: formData.phone || null,
          service: formData.service,
          message: formData.message || null,
          language: formData.language || 'en'
        }
      ])
      .select()

    if (error) throw error
    return { success: true, data }
  } catch (error) {
    console.error('Error submitting contact form:', error)
    return { success: false, error: error.message }
  }
}

// User preferences management
export async function saveUserPreferences(sessionId, preferences) {
  try {
    const { data, error } = await supabase
      .from('user_preferences')
      .upsert([
        {
          session_id: sessionId,
          language: preferences.language
        }
      ])
      .select()

    if (error) throw error
    return { success: true, data }
  } catch (error) {
    console.error('Error saving user preferences:', error)
    return { success: false, error: error.message }
  }
}

export async function getUserPreferences(sessionId) {
  try {
    const { data, error } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('session_id', sessionId)
      .single()

    if (error && error.code !== 'PGRST116') throw error
    return { success: true, data }
  } catch (error) {
    console.error('Error getting user preferences:', error)
    return { success: false, error: error.message }
  }
}

// Get all contacts (for admin purposes)
export async function getAllContacts() {
  try {
    const { data, error } = await supabase
      .from('contacts')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    return { success: true, data }
  } catch (error) {
    console.error('Error getting contacts:', error)
    return { success: false, error: error.message }
  }
}