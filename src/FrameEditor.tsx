import { Check, ImagePlus, Play, RotateCcw, Upload } from "lucide-react";
import type { Settings } from "./auction";
export default function FrameEditor({
  settings: c,
  onChange,
  replay,
  onError,
}: {
  settings: Settings;
  onChange: (x: Partial<Settings>) => void;
  replay: (x: "reveal" | "shuffle" | "sold") => void;
  onError: (x: string) => void;
}) {
  async function image(
    file: File | undefined,
    key: "logo" | "backgroundImage" | "sponsorLogo",
  ) {
    if (!file) return;
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
      onError("Choose a PNG, JPEG, or WebP image.");
      return;
    }
    if (file.size > 1500000) {
      onError("Please use an image smaller than 1.5 MB.");
      return;
    }
    const r = new FileReader();
    r.onload = () => onChange({ [key]: String(r.result) });
    r.onerror = () => onError("Could not read the image.");
    r.readAsDataURL(file);
  }
  return (
    <section className="frame-editor">
      <div className="editor-heading">
        <h3>Your frame, your identity.</h3>
        <p>Choose a look. Add your branding. Preview every moment.</p>
      </div>
      <label className="editor-label">FRAME TEMPLATE</label>
      <div className="template-options">
        {(["arena", "editorial", "electric"] as const).map((x, i) => (
          <button
            key={x}
            className={c.template === x ? "selected" : ""}
            onClick={() =>
              onChange({
                template: x,
                background: ["#142e62", "#f7f0e2", "#372061"][i],
              })
            }
          >
            <span className={`template-mini mini-${x}`}>
              <i />
              <b>XI</b>
            </span>
            <strong>{["Matchday", "Classic", "Spotlight"][i]}</strong>
            {c.template === x && <Check size={14} />}
          </button>
        ))}
      </div>
      <div className="editor-section">
        <h4>Tournament identity</h4>
        <label>
          Tournament name
          <input
            value={c.name}
            onChange={(e) => onChange({ name: e.target.value })}
          />
        </label>
        <div className="form-row">
          <label>
            Season
            <input
              value={c.season}
              onChange={(e) => onChange({ season: e.target.value })}
            />
          </label>
          <label>
            Currency
            <select
              value={c.currency}
              onChange={(e) => onChange({ currency: e.target.value })}
            >
              {["LKR", "INR", "USD", "GBP", "Points"].map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
          </label>
        </div>
        <label className="upload-control">
          <Upload size={16} />
          {c.logo ? "Replace tournament logo" : "Upload tournament logo"}
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={(e) => image(e.target.files?.[0], "logo")}
          />
        </label>
        {c.logo && (
          <button
            className="text-button"
            onClick={() => onChange({ logo: "" })}
          >
            Use Bid XI logo instead
          </button>
        )}
      </div>
      <div className="editor-section">
        <h4>Background & colors</h4>
        <button
          className="stadium-preset"
          onClick={() => onChange({ backgroundImage: "/stadium.png" })}
        >
          <img src="/stadium.png" alt="Cricket stadium background" />
          <span>Use stadium background</span>
          <ImagePlus size={16} />
        </button>
        <div className="form-row">
          <label>
            Accent
            <input
              aria-label="Accent color"
              type="color"
              value={c.accent}
              onChange={(e) => onChange({ accent: e.target.value })}
            />
          </label>
          <label>
            Frame background
            <input
              aria-label="Frame background color"
              type="color"
              value={c.background}
              onChange={(e) => onChange({ background: e.target.value })}
            />
          </label>
        </div>
        <div className="swatches">
          {["#ffbd59", "#73bbff", "#c5a5ff", "#ff8d9c", "#90ddb0"].map((x) => (
            <button
              aria-label={`Use accent ${x}`}
              key={x}
              style={{ background: x }}
              onClick={() => onChange({ accent: x })}
            >
              {x === c.accent && <Check size={15} />}
            </button>
          ))}
        </div>
        <label className="upload-control">
          <ImagePlus size={16} />
          {c.backgroundImage
            ? "Replace background image"
            : "Upload background image"}
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={(e) => image(e.target.files?.[0], "backgroundImage")}
          />
        </label>
        {c.backgroundImage && (
          <button
            className="text-button"
            onClick={() => onChange({ backgroundImage: "" })}
          >
            Remove background image
          </button>
        )}
      </div>
      <div className="editor-section">
        <h4>Layout & player details</h4>
        <div className="form-row">
          <label>
            Photo placement
            <select
              value={c.portraitSide}
              onChange={(e) =>
                onChange({
                  portraitSide: e.target.value as Settings["portraitSide"],
                })
              }
            >
              <option value="left">Left side</option>
              <option value="right">Right side</option>
            </select>
          </label>
          <label>
            Typography
            <select
              value={c.font}
              onChange={(e) =>
                onChange({ font: e.target.value as Settings["font"] })
              }
            >
              <option value="condensed">Sports condensed</option>
              <option value="sans">Clean sans</option>
            </select>
          </label>
        </div>
        <div className="form-row">
          <label>
            Photo fit
            <select
              value={c.photoFit}
              onChange={(e) =>
                onChange({ photoFit: e.target.value as Settings["photoFit"] })
              }
            >
              <option value="cover">Fill frame</option>
              <option value="contain">Show whole photo</option>
            </select>
          </label>
          <label>
            Photo alignment
            <select
              value={c.photoPosition}
              onChange={(e) =>
                onChange({
                  photoPosition: e.target.value as Settings["photoPosition"],
                })
              }
            >
              <option value="top">Top</option>
              <option value="center">Center</option>
            </select>
          </label>
        </div>
        {(["showRole", "showCountry", "showBase"] as const).map((key, i) => (
          <label className="toggle-label" key={key}>
            <input
              type="checkbox"
              checked={c[key]}
              onChange={(e) => onChange({ [key]: e.target.checked })}
            />
            {["Show player role", "Show country", "Show base price"][i]}
          </label>
        ))}
      </div>
      <div className="editor-section">
        <h4>Sponsor branding</h4>
        <label>
          Sponsor name
          <input
            placeholder="Your event sponsor"
            value={c.sponsor}
            onChange={(e) => onChange({ sponsor: e.target.value })}
          />
        </label>
        <label className="upload-control">
          <Upload size={16} />
          {c.sponsorLogo ? "Replace sponsor logo" : "Upload sponsor logo"}
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={(e) => image(e.target.files?.[0], "sponsorLogo")}
          />
        </label>
        {c.sponsorLogo && (
          <button
            className="text-button"
            onClick={() => onChange({ sponsorLogo: "" })}
          >
            Remove sponsor logo
          </button>
        )}
      </div>
      <div className="editor-section">
        <h4>Motion preview</h4>
        <label>
          Animation pacing
          <select
            value={c.motion}
            onChange={(e) =>
              onChange({ motion: e.target.value as Settings["motion"] })
            }
          >
            <option value="cinematic">Cinematic · full sequence</option>
            <option value="quick">Quick · faster auction</option>
          </select>
        </label>
        <div className="preview-buttons">
          {(["reveal", "shuffle", "sold"] as const).map((x) => (
            <button key={x} onClick={() => replay(x)}>
              <Play size={13} />
              {x}
            </button>
          ))}
        </div>
        <p className="editor-note">
          Previews don’t change results or budgets. Reduced-motion settings are
          respected.
        </p>
      </div>
    </section>
  );
}
