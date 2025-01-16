import AsyncStorage from '@react-native-async-storage/async-storage'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = "https://sqymgznimbsguzbpraen.supabase.co"
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNxeW1nem5pbWJzZ3V6YnByYWVuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzY1ODI2OTQsImV4cCI6MjA1MjE1ODY5NH0.XBBoIuaLEL7kFTA2Py2-9qb7uZoH_4SqPKvdjy7ilOs"

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})