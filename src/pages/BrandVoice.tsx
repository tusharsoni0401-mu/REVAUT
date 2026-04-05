import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Mic2, Plus, X, Eye, Loader2, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useBrandVoice } from "@/hooks/useBrandVoice";

export default function BrandVoice() {
  const { toast } = useToast();
  const {
    settings,
    loading,
    saving,
    error: brandVoiceError,
    updateTone,
    setPersona,
    addExample,
    removeExample,
    addKeyword,
    removeKeyword,
    save,
  } = useBrandVoice();

  const [newExample, setNewExample] = useState("");
  const [newInclude, setNewInclude] = useState("");
  const [newAvoid, setNewAvoid] = useState("");
  const [showPreview, setShowPreview] = useState(false);

  const handleSave = async () => {
    try {
      await save();
      toast({ title: "Brand voice saved", description: "Your AI will use these settings for new responses." });
    } catch {
      toast({ title: "Save failed", description: "Could not save to database.", variant: "destructive" });
    }
  };

  const previewResponse = `Thank you for dining with us at La Bella Italia, Sarah! Our team is thrilled to hear you enjoyed the truffle pasta — it's one of our chef's proudest creations. We truly value your experience and can't wait to welcome you back for another memorable evening. Until next time!`;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Brand Voice</h1>
        <p className="text-sm text-muted-foreground">Configure how your AI responds to reviews</p>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2"><Mic2 className="h-4 w-4" /> Tone Configuration</CardTitle>
          <CardDescription>Adjust sliders to set your brand's voice</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {[
            { label: "Formal", labelEnd: "Casual", key: "formality" as const },
            { label: "Serious", labelEnd: "Playful", key: "playfulness" as const },
            { label: "Brief", labelEnd: "Detailed", key: "brevity" as const },
          ].map(({ label, labelEnd, key }) => (
            <div key={key} className="space-y-2">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{label}</span><span>{labelEnd}</span>
              </div>
              <Slider value={settings.tone[key]} onValueChange={(v) => updateTone(key, v)} max={100} step={1} />
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Persona Prompt</CardTitle>
          <CardDescription>Define your AI's personality and behavior</CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea value={settings.persona} onChange={(e) => setPersona(e.target.value)} className="min-h-[100px]" />
          <p className={`text-xs mt-1 ${settings.persona.length > 400 ? "text-warning" : "text-muted-foreground"}`}>
            {settings.persona.length} / 500 characters
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Sample Responses</CardTitle>
          <CardDescription>Add examples the AI should learn from ({settings.examples.length}/5)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {settings.examples.map((ex, i) => (
            <div key={i} className="relative rounded-lg border p-3 text-sm">
              <Button variant="ghost" size="icon" className="absolute right-1 top-1 h-6 w-6" onClick={() => removeExample(i)}>
                <X className="h-3 w-3" />
              </Button>
              <p className="pr-6">{ex}</p>
            </div>
          ))}
          {settings.examples.length < 5 && (
            <div className="space-y-2">
              <Textarea placeholder="Paste an example response..." value={newExample} onChange={(e) => setNewExample(e.target.value)} className="min-h-[60px]" />
              <Button size="sm" variant="outline" onClick={() => { if (newExample.trim()) { addExample(newExample.trim()); setNewExample(""); } }}>
                <Plus className="h-3 w-3" /> Add Example
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Keywords</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="text-xs text-success">Always Include</Label>
            <div className="flex flex-wrap gap-1.5">
              {settings.includeKeywords.map((kw) => (
                <Badge key={kw} variant="outline" className="gap-1 border-success/30 text-success">
                  {kw}
                  <X className="h-2.5 w-2.5 cursor-pointer" onClick={() => removeKeyword("includeKeywords", kw)} />
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Input placeholder="Add keyword" value={newInclude} onChange={(e) => setNewInclude(e.target.value)} className="h-8 text-sm" onKeyDown={(e) => { if (e.key === "Enter" && newInclude.trim()) { addKeyword("includeKeywords", newInclude.trim()); setNewInclude(""); } }} />
              <Button size="sm" variant="outline" onClick={() => { if (newInclude.trim()) { addKeyword("includeKeywords", newInclude.trim()); setNewInclude(""); } }} className="h-8"><Plus className="h-3 w-3" /></Button>
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-xs text-destructive">Always Avoid</Label>
            <div className="flex flex-wrap gap-1.5">
              {settings.avoidKeywords.map((kw) => (
                <Badge key={kw} variant="outline" className="gap-1 border-destructive/30 text-destructive">
                  {kw}
                  <X className="h-2.5 w-2.5 cursor-pointer" onClick={() => removeKeyword("avoidKeywords", kw)} />
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Input placeholder="Add keyword" value={newAvoid} onChange={(e) => setNewAvoid(e.target.value)} className="h-8 text-sm" onKeyDown={(e) => { if (e.key === "Enter" && newAvoid.trim()) { addKeyword("avoidKeywords", newAvoid.trim()); setNewAvoid(""); } }} />
              <Button size="sm" variant="outline" onClick={() => { if (newAvoid.trim()) { addKeyword("avoidKeywords", newAvoid.trim()); setNewAvoid(""); } }} className="h-8"><Plus className="h-3 w-3" /></Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Preview</CardTitle>
            <Button size="sm" variant="outline" onClick={() => setShowPreview(!showPreview)}>
              <Eye className="h-3 w-3" /> {showPreview ? "Hide" : "Show"} Preview
            </Button>
          </div>
        </CardHeader>
        {showPreview && (
          <CardContent>
            <div className="rounded-lg bg-accent/50 border p-3">
              <p className="text-xs text-muted-foreground mb-1">Sample AI response with current settings:</p>
              <p className="text-sm leading-relaxed">{previewResponse}</p>
            </div>
          </CardContent>
        )}
      </Card>

      {brandVoiceError && (
        <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3">
          <AlertCircle className="h-4 w-4 text-destructive shrink-0" />
          <p className="text-sm text-destructive">{brandVoiceError}</p>
        </div>
      )}

      <Button className="w-full" onClick={handleSave} disabled={saving}>
        {saving
          ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving…</>
          : "Save Brand Voice Settings"}
      </Button>
    </div>
  );
}
