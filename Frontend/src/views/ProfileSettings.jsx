import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Bell, Camera, Check, ChevronDown, Database, LockKeyhole, Mail, Save, ShieldCheck, SlidersHorizontal, Trash2, TriangleAlert, UserRound, X } from "lucide-react";
import { getProfile, updateProfile, uploadAvatar } from "../Actions/ProfileAction.js";
import { deleteAllDocuments } from "../Actions/DashboardAction.js";
import { deleteAccount, requestDeleteAccountOTP } from "../Actions/DeleteAccountAction.js";
import { CircularLoader } from "../components/Loader.jsx";
import { useAuth } from "../context/AuthContext.jsx";

const emptyProfile = { role: "", experience_level: "", work_style: "", primary_goal: "", preferred_answer_style: "", preferences: { response_tone: "clear_thoughtful", response_detail: "balanced", memory_enabled: true, personalization_enabled: true, custom_instructions: "" } };
const profileDate = (value) => { const date = new Date(value); return !value || Number.isNaN(date.getTime()) ? "Member" : new Intl.DateTimeFormat(undefined, { day: "2-digit", month: "short", year: "numeric" }).format(date); };

export default function ProfileSettings({ mode = "Profile" }) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(emptyProfile);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [dangerMessage, setDangerMessage] = useState("");
  const [documentConfirmOpen, setDocumentConfirmOpen] = useState(false);
  const [deletingDocuments, setDeletingDocuments] = useState(false);
  const [accountDeletionOpen, setAccountDeletionOpen] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [sendingOtp, setSendingOtp] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const avatarInput = useRef(null);
  const isSettings = mode === "Settings";
  const fullName = user?.name || user?.full_name || user?.email?.split("@")[0] || "Your profile";
  const email = user?.email || "Email unavailable";
  const initials = fullName.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase();

  useEffect(() => {
    getProfile().then((data) => setProfile({ ...emptyProfile, ...data, preferences: { ...emptyProfile.preferences, ...(data?.preferences || {}) } })).catch(() => setMessage("We could not load your profile yet.")).finally(() => setLoading(false));
  }, []);

  const setField = (key, value) => setProfile((current) => ({ ...current, [key]: value }));
  const setPreference = (key, value) => setProfile((current) => ({ ...current, preferences: { ...current.preferences, [key]: value } }));
  const save = async (event) => { event.preventDefault(); setSaving(true); setMessage(""); try { await updateProfile(profile); setMessage("Your changes are saved."); } catch (error) { setMessage(error.message || "Unable to save changes."); } finally { setSaving(false); } };
  const changeAvatar = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploadingAvatar(true);
    try {
      const data = await uploadAvatar(file);
      const avatar = data?.avatar || data;
      setProfile((current) => ({ ...current, avatar }));
      window.dispatchEvent(new CustomEvent("upolabdhi-avatar-updated", { detail: { avatar } }));
      setMessage("Profile photo updated.");
    } catch (error) {
      setMessage(error.message || "Unable to update your photo.");
    } finally {
      setUploadingAvatar(false);
      if (avatarInput.current) avatarInput.current.value = "";
    }
  };
  const confirmDeleteDocuments = async () => { setDeletingDocuments(true); setDangerMessage(""); try { await deleteAllDocuments(); setDocumentConfirmOpen(false); setDangerMessage("All documents were deleted."); } catch (error) { setDangerMessage(error.message || "Unable to delete documents."); } finally { setDeletingDocuments(false); } };
  const sendDeletionOtp = async () => { if (!user?.email) { setDangerMessage("Your signed-in email address is unavailable."); return; } setSendingOtp(true); setDangerMessage(""); try { await requestDeleteAccountOTP(user.email); setOtpSent(true); setDangerMessage("A verification code was sent to your email."); } catch (error) { setDangerMessage(error.message || "Unable to send a verification code."); } finally { setSendingOtp(false); } };
  const confirmDeleteAccount = async () => { if (!otp.trim()) { setDangerMessage("Enter the verification code from your email."); return; } setDeletingAccount(true); setDangerMessage(""); try { await deleteAccount(otp.trim()); signOut(); navigate("/login", { replace: true }); } catch (error) { setDangerMessage(error.message || "Unable to delete account. Check the verification code and try again."); } finally { setDeletingAccount(false); } };

  if (isSettings) return (
    <main className="account-page account-settings-page">
      {loading && <CircularLoader overlay label="Loading settings" />}
      <header className="account-settings-heading"><p>Make it yours</p><h1>Settings.</h1><span>Tune the way your workspace answers, stores, and protects.</span></header>
      <div className="account-settings-layout">
        <aside className="account-settings-nav" aria-label="Settings sections">
          <button className="active" type="button"><SlidersHorizontal /> Response style</button><button type="button"><ShieldCheck /> Privacy &amp; security</button><button type="button"><Database /> Data &amp; storage</button><button type="button"><Bell /> Notifications</button>
        </aside>
        <form className="account-settings-content" onSubmit={save}>
          <section className="account-settings-card"><div className="account-settings-card-heading"><p>Instructions &amp; response tone</p><h2>Shape your assistant.</h2><span>These preferences apply to new conversations and can be adjusted anytime.</span></div><label className="account-setting-field">Response tone<select value={profile.preferences.response_tone} onChange={(event) => setPreference("response_tone", event.target.value)}><option value="clear_thoughtful">Clear &amp; thoughtful</option><option value="direct">Direct</option><option value="warm">Warm and conversational</option></select></label><label className="account-setting-field">Custom instructions<textarea value={profile.preferences.custom_instructions || ""} onChange={(event) => setPreference("custom_instructions", event.target.value)} placeholder="Tell Upolabdhi how you would like answers delivered." rows="4" /></label><p className="account-settings-hint">Try asking for your preferred level of detail, reading level, or how you want uncertainty explained.</p><footer className="account-settings-save"><span role="status">{message && <><Check size={15} /> {message}</>}</span><button type="submit" disabled={loading || saving}><Check size={17} /> {saving ? "Saving..." : "Save preferences"}</button></footer></section>
          <section className="account-settings-card"><div className="account-settings-card-heading"><p>Privacy &amp; security</p><h2>Your knowledge stays yours.</h2><span>Simple controls for the data inside this workspace.</span><LockKeyhole className="account-settings-heading-icon" /></div><div className="account-setting-toggle"><div><strong>Private workspace</strong><span>Your documents are only visible to you.</span></div><input type="checkbox" checked readOnly /></div><div className="account-setting-toggle"><div><strong>Conversation memory</strong><span>Let answers reference earlier turns in this chat.</span></div><input type="checkbox" checked={Boolean(profile.preferences.memory_enabled)} onChange={(event) => setPreference("memory_enabled", event.target.checked)} /></div><div className="account-setting-toggle"><div><strong>Improve retrieval with feedback</strong><span>Use your thumbs up/down to improve this workspace.</span></div><input type="checkbox" checked={Boolean(profile.preferences.personalization_enabled)} onChange={(event) => setPreference("personalization_enabled", event.target.checked)} /></div></section>
          <section className="account-settings-card account-danger-zone"><div className="account-settings-card-heading"><p>Danger zone</p><h2>Take your data with you.</h2><span>These actions cannot be undone. Export anything you want to keep first.</span><TriangleAlert className="account-settings-heading-icon" /></div><div className="account-danger-action"><div><strong>Delete all documents</strong><span>Remove your files and their search index.</span></div><button type="button" onClick={() => { setDangerMessage(""); setDocumentConfirmOpen(true); }}><Trash2 size={16} /> Delete all</button></div><div className="account-danger-action"><div><strong>Delete account</strong><span>Remove your profile, documents, and chat history.</span></div><button type="button" className="solid" onClick={() => { setDangerMessage(""); setAccountDeletionOpen(true); setOtpSent(false); setOtp(""); }}><Trash2 size={16} /> Delete account</button></div>{dangerMessage && <p className="account-danger-message" role="status">{dangerMessage}</p>}</section>
          {accountDeletionOpen && <section className="account-deletion-verification" aria-label="Account deletion verification"><div className="account-deletion-title"><TriangleAlert /><h2>Account deletion<br />verification required</h2></div><div className="account-deletion-content"><p>To permanently delete your account, we will send a verification code to the email address on this signed-in account.</p><label><span>{email}</span><Mail size={19} /></label>{otpSent && <input value={otp} onChange={(event) => setOtp(event.target.value)} inputMode="numeric" autoComplete="one-time-code" placeholder="Enter verification code" />}{dangerMessage && <small role="status">{dangerMessage}</small>}<div><button type="button" onClick={otpSent ? confirmDeleteAccount : sendDeletionOtp} disabled={sendingOtp || deletingAccount}>{otpSent ? (deletingAccount ? "Deleting account..." : "Confirm deletion") : (sendingOtp ? "Sending code..." : "Send OTP")} <ArrowRight size={17} /></button><button type="button" className="account-cancel-button" onClick={() => { setAccountDeletionOpen(false); setDangerMessage(""); }}>Cancel</button></div></div></section>}
        </form>
      </div>
      {documentConfirmOpen && <div className="account-confirm-backdrop" role="presentation" onMouseDown={() => !deletingDocuments && setDocumentConfirmOpen(false)}><section className="account-confirm-dialog" role="dialog" aria-modal="true" aria-labelledby="document-delete-title" onMouseDown={(event) => event.stopPropagation()}><button className="account-confirm-close" type="button" aria-label="Close confirmation" disabled={deletingDocuments} onClick={() => setDocumentConfirmOpen(false)}><X size={20} /></button><span className="account-confirm-icon"><Trash2 size={25} /></span><h2 id="document-delete-title">Delete all documents?</h2><p>This permanently removes every document and its search index. This action cannot be undone.</p><div><button type="button" className="account-cancel-button" disabled={deletingDocuments} onClick={() => setDocumentConfirmOpen(false)}>Keep documents</button><button type="button" className="account-confirm-delete" disabled={deletingDocuments} onClick={confirmDeleteDocuments}><Trash2 size={17} /> {deletingDocuments ? "Deleting..." : "Delete all documents"}</button></div></section></div>}
    </main>
  );

  return (
    <main className="account-page account-profile-page">
      {loading && <CircularLoader overlay label={`Loading ${isSettings ? "settings" : "profile"}`} />}
      <header className="account-profile-heading"><p>{isSettings ? "Workspace settings" : "Your profile"}</p><h1>{isSettings ? "Make Upolabdhi work your way." : "A workspace that feels like you."}</h1><span>{isSettings ? "Choose how your assistant responds and remembers." : "Keep your preferences close to the way you think."}</span></header>
      <form className="account-profile-layout" onSubmit={save}>
        <section className="account-profile-summary" aria-label="Profile summary">
          <div className="account-profile-banner" aria-hidden="true" />
          <div className="account-profile-identity">
            <div className="account-profile-avatar">
              {profile.avatar?.secure_url ? <img src={profile.avatar.secure_url} alt="Profile" /> : <span>{initials || <UserRound />}</span>}
              {uploadingAvatar && (
                <div className="account-avatar-uploading" role="status" aria-live="polite">
                  <span className="account-avatar-spinner" aria-hidden="true" />
                  <small>Uploading photo...</small>
                </div>
              )}
            </div>
            <div className="account-profile-person"><strong>{fullName}</strong><small>{email}</small><em>{profile.role || "Workspace member"}</em></div>
            <input ref={avatarInput} hidden type="file" accept="image/*" onChange={changeAvatar} />
            <button type="button" className="account-photo-button" disabled={uploadingAvatar} onClick={() => avatarInput.current?.click()}><Camera size={17} /> {uploadingAvatar ? "Uploading..." : "Edit photo"}</button>
          </div>
          <dl className="account-profile-facts"><div><dt>Focus style</dt><dd>{profile.work_style || "Set your focus"}</dd></div><div><dt>First goal</dt><dd>{profile.primary_goal || "Set a goal"}</dd></div><div><dt>Member since</dt><dd>{profileDate(user?.created_at || user?.createdAt)}</dd></div></dl>
        </section>
        <section className="account-profile-details">
          <div className="account-details-heading"><p>{isSettings ? "Response preferences" : "Personal details"}</p><h2>{isSettings ? "Shape every answer." : "Your workspace profile."}</h2></div>
          {!isSettings && <div className="account-readonly-fields"><label>Full name<input value={fullName} readOnly /></label><small>The current account service does not provide a profile-name update API.</small><label>Email address<input value={email} readOnly /></label></div>}
          <div className="account-profile-fields">
            <label>What describes you best<span className="account-select-wrap"><select value={profile.role || ""} onChange={(event) => setField("role", event.target.value)}><option value="">Choose a role</option><option value="Student">Student</option><option value="Researcher">Researcher</option><option value="Professional">Professional</option><option value="Educator">Educator</option></select><ChevronDown aria-hidden="true" /></span></label>
            <label>Experience level<select value={profile.experience_level || ""} onChange={(event) => setField("experience_level", event.target.value)}><option value="">Choose level</option><option value="beginner">Beginner</option><option value="intermediate">Intermediate</option><option value="advanced">Advanced</option></select></label>
            <label>Focus style<input value={profile.work_style || ""} onChange={(event) => setField("work_style", event.target.value)} placeholder="e.g. Deep focus" /></label>
            <label>Primary goal<input value={profile.primary_goal || ""} onChange={(event) => setField("primary_goal", event.target.value)} placeholder="e.g. Organize knowledge" /></label>
            <label>Answer style<select value={profile.preferred_answer_style || ""} onChange={(event) => setField("preferred_answer_style", event.target.value)}><option value="">Choose style</option><option value="concise">Concise</option><option value="balanced">Balanced</option><option value="detailed">Detailed</option></select></label>
            <label>Response tone<select value={profile.preferences.response_tone} onChange={(event) => setPreference("response_tone", event.target.value)}><option value="clear_thoughtful">Clear and thoughtful</option><option value="direct">Direct</option><option value="warm">Warm and conversational</option></select></label>
          </div>
          <label className="account-profile-instructions">Custom instructions<textarea value={profile.preferences.custom_instructions || ""} onChange={(event) => setPreference("custom_instructions", event.target.value)} placeholder="Anything your assistant should keep in mind?" rows="3" /></label>
          <label className="account-profile-toggle"><input type="checkbox" checked={Boolean(profile.preferences.memory_enabled)} onChange={(event) => setPreference("memory_enabled", event.target.checked)} /><span>Use memory across conversations</span></label>
          <footer className="account-profile-actions"><span role="status">{message && <><Check size={16} /> {message}</>}</span><button type="submit" disabled={loading || saving}><Save size={17} /> {saving ? "Saving changes..." : "Save changes"}</button></footer>
        </section>
      </form>
    </main>
  );
}
