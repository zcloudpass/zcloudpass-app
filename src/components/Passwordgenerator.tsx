import { useState } from "react";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Slider } from "./ui/slider";
import { Switch } from "./ui/switch";
import { RefreshCw, Copy, Check } from "lucide-react";

interface PasswordGeneratorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGenerate: (password: string) => void;
}

const WORD_LIST = [
  "correct",
  "horse",
  "battery",
  "staple",
  "dragon",
  "monkey",
  "puzzle",
  "secret",
  "castle",
  "thunder",
  "rainbow",
  "galaxy",
  "planet",
  "ocean",
  "mountain",
  "forest",
  "river",
  "sunset",
  "coffee",
  "wizard",
  "knight",
  "phoenix",
  "crystal",
  "shadow",
  "silver",
  "golden",
  "diamond",
  "emerald",
  "tiger",
  "eagle",
  "wolf",
  "falcon",
  "anchor",
  "compass",
  "voyage",
  "island",
  "treasure",
  "captain",
  "pirate",
  "mermaid",
  "unicorn",
  "griffin",
  "centaur",
  "pegasus",
  "kraken",
  "atlantis",
  "olympus",
  "valhalla",
  "nebula",
  "cosmos",
  "meteor",
  "comet",
  "aurora",
  "eclipse",
  "solstice",
  "equinox",
  "quantum",
  "neutron",
  "photon",
  "electron",
  "proton",
  "particle",
  "energy",
  "velocity",
  "harmony",
  "melody",
  "rhythm",
  "symphony",
  "chorus",
  "sonata",
  "concerto",
  "prelude",
  "crimson",
  "scarlet",
  "azure",
  "violet",
  "amber",
  "jade",
  "ivory",
  "ebony",
  "thunder",
  "lightning",
  "blizzard",
  "tempest",
  "monsoon",
  "typhoon",
  "cyclone",
  "tornado",
  "glacier",
  "volcano",
  "desert",
  "tundra",
  "prairie",
  "canyon",
  "valley",
  "summit",
  "orchid",
  "lotus",
  "jasmine",
  "tulip",
  "rose",
  "lily",
  "daisy",
  "violet",
  "maple",
  "willow",
  "cedar",
  "pine",
  "birch",
  "oak",
  "elm",
  "ash",
];

const SEPARATORS = ["-", "_", ".", ",", " ", ""];
const CAPITALIZE_OPTIONS = ["none", "first", "all", "random"] as const;

export default function PasswordGenerator({
  open,
  onOpenChange,
  onGenerate,
}: PasswordGeneratorProps) {
  const [mode, setMode] = useState<"password" | "passphrase">("password");
  const [password, setPassword] = useState("");
  const [copied, setCopied] = useState(false);

  // Password mode settings
  const [length, setLength] = useState(16);
  const [includeUppercase, setIncludeUppercase] = useState(true);
  const [includeLowercase, setIncludeLowercase] = useState(true);
  const [includeNumbers, setIncludeNumbers] = useState(true);
  const [includeSymbols, setIncludeSymbols] = useState(true);
  const [excludeAmbiguous, setExcludeAmbiguous] = useState(false);

  // Passphrase mode settings
  const [wordCount, setWordCount] = useState(4);
  const [separator, setSeparator] = useState("-");
  const [capitalize, setCapitalize] =
    useState<(typeof CAPITALIZE_OPTIONS)[number]>("first");
  const [includeNumber, setIncludeNumber] = useState(true);

  const generateRandomPassword = () => {
    const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const lowercase = "abcdefghijklmnopqrstuvwxyz";
    const numbers = "0123456789";
    const symbols = "!@#$%^&*()_+-=[]{}|;:,.<>?";
    const ambiguous = "il1Lo0O";

    let charset = "";
    if (includeUppercase) charset += uppercase;
    if (includeLowercase) charset += lowercase;
    if (includeNumbers) charset += numbers;
    if (includeSymbols) charset += symbols;

    if (excludeAmbiguous) {
      charset = charset
        .split("")
        .filter((char) => !ambiguous.includes(char))
        .join("");
    }

    if (charset.length === 0) {
      charset = lowercase; // Fallback
    }

    let result = "";
    const array = new Uint32Array(length);
    crypto.getRandomValues(array);

    for (let i = 0; i < length; i++) {
      result += charset[array[i] % charset.length];
    }

    // Ensure at least one character from each selected type
    const ensureChars = [];
    if (includeUppercase) ensureChars.push(uppercase);
    if (includeLowercase) ensureChars.push(lowercase);
    if (includeNumbers) ensureChars.push(numbers);
    if (includeSymbols) ensureChars.push(symbols);

    ensureChars.forEach((set, idx) => {
      if (!result.split("").some((char) => set.includes(char))) {
        const randomChar = set[Math.floor(Math.random() * set.length)];
        const pos = Math.floor(Math.random() * result.length);
        result =
          result.substring(0, pos) + randomChar + result.substring(pos + 1);
      }
    });

    return result;
  };

  const generateRandomPassphrase = () => {
    const selectedWords: string[] = [];
    const usedIndices = new Set<number>();

    // Select random unique words
    while (selectedWords.length < wordCount) {
      const index = Math.floor(Math.random() * WORD_LIST.length);
      if (!usedIndices.has(index)) {
        usedIndices.add(index);
        selectedWords.push(WORD_LIST[index]);
      }
    }

    // Apply capitalization
    const capitalizedWords = selectedWords.map((word, idx) => {
      switch (capitalize) {
        case "all":
          return word.charAt(0).toUpperCase() + word.slice(1);
        case "first":
          return idx === 0
            ? word.charAt(0).toUpperCase() + word.slice(1)
            : word;
        case "random":
          return Math.random() > 0.5
            ? word.charAt(0).toUpperCase() + word.slice(1)
            : word;
        default:
          return word;
      }
    });

    let result = capitalizedWords.join(separator);

    // Add number at the end
    if (includeNumber) {
      const randomNum = Math.floor(Math.random() * 9999);
      result += separator + randomNum;
    }

    return result;
  };

  const handleGenerate = () => {
    const newPassword =
      mode === "password"
        ? generateRandomPassword()
        : generateRandomPassphrase();
    setPassword(newPassword);
    setCopied(false);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(password);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleUsePassword = () => {
    if (password) {
      onGenerate(password);
      onOpenChange(false);
    }
  };

  // Generate initial password when dialog opens
  const handleOpenChange = (open: boolean) => {
    if (open && !password) {
      handleGenerate();
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="border shadow-2xl max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            Password Generator
          </DialogTitle>
          <DialogDescription>
            Create a strong password or passphrase
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Mode Toggle */}
          <div className="flex gap-2">
            <Button
              variant={mode === "password" ? "default" : "outline"}
              onClick={() => setMode("password")}
              className="flex-1"
            >
              Password
            </Button>
            <Button
              variant={mode === "passphrase" ? "default" : "outline"}
              onClick={() => setMode("passphrase")}
              className="flex-1"
            >
              Passphrase
            </Button>
          </div>

          {/* Generated Password Display */}
          <div className="space-y-2">
            <Label>
              Generated {mode === "password" ? "Password" : "Passphrase"}
            </Label>
            <div className="flex gap-2">
              <Input
                value={password}
                readOnly
                className="font-mono text-base"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={handleCopy}
                disabled={!password}
              >
                {copied ? (
                  <Check className="w-4 h-4 text-green-500" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </Button>
              <Button variant="outline" size="icon" onClick={handleGenerate}>
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Password Mode Settings */}
          {mode === "password" && (
            <div className="space-y-5">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Length: {length}</Label>
                </div>
                <Slider
                  value={[length]}
                  onValueChange={(value) => setLength(value[0])}
                  min={8}
                  max={64}
                  step={1}
                  className="w-full"
                />
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="uppercase">Uppercase (A-Z)</Label>
                  <Switch
                    id="uppercase"
                    checked={includeUppercase}
                    onCheckedChange={setIncludeUppercase}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="lowercase">Lowercase (a-z)</Label>
                  <Switch
                    id="lowercase"
                    checked={includeLowercase}
                    onCheckedChange={setIncludeLowercase}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="numbers">Numbers (0-9)</Label>
                  <Switch
                    id="numbers"
                    checked={includeNumbers}
                    onCheckedChange={setIncludeNumbers}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="symbols">Symbols (!@#$%...)</Label>
                  <Switch
                    id="symbols"
                    checked={includeSymbols}
                    onCheckedChange={setIncludeSymbols}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="ambiguous">Exclude Ambiguous (il1Lo0O)</Label>
                  <Switch
                    id="ambiguous"
                    checked={excludeAmbiguous}
                    onCheckedChange={setExcludeAmbiguous}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Passphrase Mode Settings */}
          {mode === "passphrase" && (
            <div className="space-y-5">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Words: {wordCount}</Label>
                </div>
                <Slider
                  value={[wordCount]}
                  onValueChange={(value) => setWordCount(value[0])}
                  min={3}
                  max={8}
                  step={1}
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <Label>Separator</Label>
                <div className="grid grid-cols-6 gap-2">
                  {SEPARATORS.map((sep) => (
                    <Button
                      key={sep}
                      variant={separator === sep ? "default" : "outline"}
                      onClick={() => setSeparator(sep)}
                      className="h-10 px-2"
                    >
                      {sep === "" ? "None" : sep === " " ? "Space" : sep}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Capitalization</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant={capitalize === "none" ? "default" : "outline"}
                    onClick={() => setCapitalize("none")}
                    className="h-10"
                  >
                    None
                  </Button>
                  <Button
                    variant={capitalize === "first" ? "default" : "outline"}
                    onClick={() => setCapitalize("first")}
                    className="h-10"
                  >
                    First Word
                  </Button>
                  <Button
                    variant={capitalize === "all" ? "default" : "outline"}
                    onClick={() => setCapitalize("all")}
                    className="h-10"
                  >
                    All Words
                  </Button>
                  <Button
                    variant={capitalize === "random" ? "default" : "outline"}
                    onClick={() => setCapitalize("random")}
                    className="h-10"
                  >
                    Random
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="includeNumber">Include Number</Label>
                <Switch
                  id="includeNumber"
                  checked={includeNumber}
                  onCheckedChange={setIncludeNumber}
                />
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-2 pt-4">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={handleUsePassword}
            disabled={!password}
            className="flex-1 bg-foreground text-background hover:bg-foreground/90"
          >
            Use Password
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
