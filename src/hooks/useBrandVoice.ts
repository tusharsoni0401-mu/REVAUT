import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";

export interface BrandVoiceSettings {
  tone: {
    formality:   number[];
    playfulness: number[];
    brevity:     number[];
  };
  persona:         string;
  examples:        string[];
  includeKeywords: string[];
  avoidKeywords:   string[];
}

export const DEFAULT_SETTINGS: BrandVoiceSettings = {
  tone: { formality: [60], playfulness: [40], brevity: [50] },
  persona:
    "You are a warm, professional restaurant manager who genuinely cares about every guest's experience. You speak with confidence and warmth, always maintaining a hospitable tone. You acknowledge specific details from the review and offer concrete next steps when addressing concerns.",
  examples: [
    "Thank you so much for your kind words! We're delighted you enjoyed your meal with us. Our team works hard to create memorable dining experiences, and reviews like yours keep us motivated!",
    "We appreciate your honest feedback and take your concerns seriously. We're continuously working to improve, and your input helps us do that. We'd love the chance to make your next visit exceptional.",
  ],
  includeKeywords: ["La Bella Italia", "team", "experience"],
  avoidKeywords:   ["unfortunately", "policy", "cannot"],
};

// Module-level cache — kept in sync with the DB row so geminiService.ts
// (which runs outside React) can call getBrandVoiceSettings() synchronously.
let _cachedSettings: BrandVoiceSettings = DEFAULT_SETTINGS;

function rowToSettings(row: Record<string, unknown>): BrandVoiceSettings {
  const tone = row.tone as BrandVoiceSettings["tone"];
  return {
    tone: {
      formality:   tone?.formality   ?? DEFAULT_SETTINGS.tone.formality,
      playfulness: tone?.playfulness ?? DEFAULT_SETTINGS.tone.playfulness,
      brevity:     tone?.brevity     ?? DEFAULT_SETTINGS.tone.brevity,
    },
    persona:         (row.persona          as string)   ?? DEFAULT_SETTINGS.persona,
    examples:        (row.examples         as string[]) ?? DEFAULT_SETTINGS.examples,
    includeKeywords: (row.include_keywords as string[]) ?? DEFAULT_SETTINGS.includeKeywords,
    avoidKeywords:   (row.avoid_keywords   as string[]) ?? DEFAULT_SETTINGS.avoidKeywords,
  };
}

export function useBrandVoice() {
  const [settings, setSettings] = useState<BrandVoiceSettings>(DEFAULT_SETTINGS);
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [error,    setError]    = useState<string | null>(null);

  // Load from Supabase on mount
  useEffect(() => {
    async function load() {
      setLoading(true);
      const { data, error } = await supabase
        .from("brand_voice_settings")
        .select("*")
        .eq("id", "default")
        .single();

      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }

      if (data) {
        const loaded = rowToSettings(data as Record<string, unknown>);
        _cachedSettings = loaded;
        setSettings(loaded);
      }
      setLoading(false);
    }
    load();
  }, []);

  // Keep cache in sync whenever settings change locally
  useEffect(() => {
    _cachedSettings = settings;
  }, [settings]);

  const updateTone = useCallback(
    (key: keyof BrandVoiceSettings["tone"], value: number[]) => {
      setSettings((prev) => ({ ...prev, tone: { ...prev.tone, [key]: value } }));
    },
    []
  );

  const setPersona = useCallback((persona: string) => {
    setSettings((prev) => ({ ...prev, persona }));
  }, []);

  const setExamples = useCallback((examples: string[]) => {
    setSettings((prev) => ({ ...prev, examples }));
  }, []);

  const addExample = useCallback((example: string) => {
    setSettings((prev) => ({
      ...prev,
      examples: prev.examples.length < 5 ? [...prev.examples, example] : prev.examples,
    }));
  }, []);

  const removeExample = useCallback((index: number) => {
    setSettings((prev) => ({
      ...prev,
      examples: prev.examples.filter((_, i) => i !== index),
    }));
  }, []);

  const addKeyword = useCallback(
    (type: "includeKeywords" | "avoidKeywords", keyword: string) => {
      setSettings((prev) => ({ ...prev, [type]: [...prev[type], keyword] }));
    },
    []
  );

  const removeKeyword = useCallback(
    (type: "includeKeywords" | "avoidKeywords", keyword: string) => {
      setSettings((prev) => ({
        ...prev,
        [type]: prev[type].filter((k) => k !== keyword),
      }));
    },
    []
  );

  // Persist current settings to Supabase
  const save = useCallback(async () => {
    setSaving(true);
    setError(null);
    const { error } = await supabase
      .from("brand_voice_settings")
      .update({
        tone:             settings.tone,
        persona:          settings.persona,
        examples:         settings.examples,
        include_keywords: settings.includeKeywords,
        avoid_keywords:   settings.avoidKeywords,
        updated_at:       new Date().toISOString(),
      })
      .eq("id", "default");

    setSaving(false);
    if (error) {
      setError(error.message);
      throw new Error(error.message);
    }
    _cachedSettings = settings;
  }, [settings]);

  const reset = useCallback(async () => {
    setSettings(DEFAULT_SETTINGS);
    setSaving(true);
    const { error } = await supabase
      .from("brand_voice_settings")
      .update({
        tone:             DEFAULT_SETTINGS.tone,
        persona:          DEFAULT_SETTINGS.persona,
        examples:         DEFAULT_SETTINGS.examples,
        include_keywords: DEFAULT_SETTINGS.includeKeywords,
        avoid_keywords:   DEFAULT_SETTINGS.avoidKeywords,
        updated_at:       new Date().toISOString(),
      })
      .eq("id", "default");
    setSaving(false);
    if (error) setError(error.message);
    else _cachedSettings = DEFAULT_SETTINGS;
  }, []);

  return {
    settings,
    loading,
    saving,
    error,
    updateTone,
    setPersona,
    setExamples,
    addExample,
    removeExample,
    addKeyword,
    removeKeyword,
    save,
    reset,
  };
}

// Standalone sync reader for use outside React (geminiService.ts).
// Returns the last value loaded from the DB, or DEFAULT_SETTINGS on first call.
export function getBrandVoiceSettings(): BrandVoiceSettings {
  return _cachedSettings;
}
