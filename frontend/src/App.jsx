import { useEffect, useState } from 'react';
import {
  Activity, AlertTriangle, ArrowRight, BarChart3, BellRing, CheckCircle2, ChevronRight,
  ClipboardPenLine, FileAudio, FileText, Image as ImageIcon, LayoutDashboard, MapPin,
  Menu, MessageSquareText, ShieldCheck, Siren, Upload, X, Shield, Users, Radio, Navigation,
  Eye, Check, ExternalLink
} from 'lucide-react';
import { api, session } from './api';
import OfficialDashboard from './OfficialDashboard';

const steps = [
  ['01', ClipboardPenLine, '1. Citizen Field Submission', 'Reporter shares situation, flood water level, victims, landmark and optional photos.', 'blue'],
  ['02', Activity, '2. AI/ML NLP Processing', 'HumAID models classify disaster type, extract impacts, geocode coordinates and assess urgency.', 'red'],
  ['03', ShieldCheck, '3. Government Command Action', 'Disaster officials review telemetry, inspect live map, cluster duplicates, and dispatch rescue teams.', 'gold'],
];

const empty = { total: 0, underAnalysis: 0, review: 0, resolved: 0, categories: {}, priorities: {} };

function Button({ children, kind = 'primary', ...p }) {
  return <button className={'btn ' + kind} {...p}>{children}</button>;
}

function Notice({ message, type = 'info' }) {
  return message ? (
    <div className={'notice ' + type}>
      {type === 'error' ? <AlertTriangle size={16} /> : <CheckCircle2 size={16} />}
      <span>{message}</span>
    </div>
  ) : null;
}

function Landing({ go, onOfficialDirect, onSubmitReportClick }) {
  const [menu, setMenu] = useState(false);

  return (
    <main className="landing">
      {/* Hero Section */}
      <section className="hero" id="home">
        <video className="hero-video" autoPlay muted loop playsInline>
          <source src="/videos/disaster_response_bg.mp4" type="video/mp4" />
          <source src="/videos/disaster_response_bg.webm" type="video/webm" />
        </video>
        <div className="hero-overlay" />

        <header>
          <a className="brand light" href="#home">
            <span className="brand-mark">D</span>Disaster<span>ReportAI</span>
          </a>
          <nav className={menu ? 'shown' : ''}>
            <a href="#about">About</a>
            <a href="#command-center">Command Center</a>
            <a href="#workflow">Workflow</a>
            <a href="#intelligence">AI Engine</a>
            <Button kind="outline-light" onClick={() => go('login')}>Citizen Login</Button>
            <Button kind="alert" onClick={onSubmitReportClick}>Submit Report <ArrowRight size={16} /></Button>
          </nav>
          <button className="menu" onClick={() => setMenu(!menu)}>{menu ? <X /> : <Menu />}</button>
        </header>

        <div className="hero-content">
          <h1><span>Every report can</span><em>shape emergency response.</em></h1>
          <p>
            Capture citizen disaster observations, preprocess signals with machine learning, and deliver actionable visual intelligence to government disaster management authorities.
          </p>
          <div className="hero-actions">
            <Button kind="alert" onClick={onSubmitReportClick}>
              Submit a field report <ArrowRight size={17} />
            </Button>
            <button
              onClick={onOfficialDirect}
              style={{
                background: 'rgba(2, 132, 199, 0.25)',
                color: '#ffffff',
                border: '2px solid #38bdf8',
                borderRadius: '4px',
                padding: '12px 20px',
                fontSize: '14px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                backdropFilter: 'blur(8px)',
              }}
            >
              <Shield size={16} /> Open Government Dashboard <ArrowRight size={16} />
            </button>
          </div>
        </div>

        <div className="hero-quick">
          <div className="quick-track">
            <div><FileText /><span><b>HumAID NLP Models</b> Multi-hazard classifier</span></div>
            <div><MapPin /><span><b>Live OpenStreetMap</b> Geocoded GPS coordinates</span></div>
            <div><Shield /><span><b>NDMA / SDMA Triage</b> Official response dispatch</span></div>
            <div aria-hidden="true"><FileText /><span><b>HumAID NLP Models</b> Multi-hazard classifier</span></div>
            <div aria-hidden="true"><MapPin /><span><b>Live OpenStreetMap</b> Geocoded GPS coordinates</span></div>
            <div aria-hidden="true"><Shield /><span><b>NDMA / SDMA Triage</b> Official response dispatch</span></div>
          </div>
        </div>
      </section>

      {/* Uploaded Command Center Images Showcase Gallery */}
      <section id="command-center" style={{ padding: '80px clamp(22px, 8vw, 120px)', background: '#071224', color: '#f8fafc' }}>
        <div style={{ maxWidth: '800px', marginBottom: '30px' }}>
          <p className="section-label on-dark">GOVERNMENT & EMERGENCY INTEGRATION</p>
          <h2 style={{ fontSize: 'clamp(32px, 4vw, 54px)', margin: '0 0 12px', color: '#f8fafc' }}>
            Connected to National Disaster War Rooms
          </h2>
          <p style={{ fontSize: '16px', color: '#94a3b8', lineHeight: '1.7', margin: 0 }}>
            Reports submitted by citizens are preprocessed by machine learning and fed directly into multi-screen emergency command centers, state operations hubs, and tactical watercraft teams.
          </p>
        </div>

        <div className="command-gallery-grid">
          <div className="command-img-card">
            <img src="/images/ndma_command_center.jpg" alt="NDMA National Command Center" />
            <div className="command-img-overlay">
              <span className="command-img-badge">TIER-1 NATIONAL FACILITY</span>
              <h4 className="command-img-title">NDMA National Command Center</h4>
              <span className="command-img-sub">Wide-area GIS situational grid & cross-state deployment</span>
            </div>
          </div>

          <div className="command-img-card">
            <img src="/images/disaster_monitoring_wall.jpg" alt="Disaster Response Monitoring Operations Center" />
            <div className="command-img-overlay">
              <span className="command-img-badge">MULTI-SCREEN MONITORING</span>
              <h4 className="command-img-title">Disaster Response Monitoring Wall</h4>
              <span className="command-img-sub">Real-time resource capacity & casualty analytics</span>
            </div>
          </div>

          <div className="command-img-card">
            <img src="/images/state_emergency_center.jpg" alt="State Emergency Operations Center" />
            <div className="command-img-overlay">
              <span className="command-img-badge">STATE EMERGENCY CELL</span>
              <h4 className="command-img-title">State Emergency Operation Center</h4>
              <span className="command-img-sub">Bharat weather forecast & real-time radar inundation</span>
            </div>
          </div>

          <div className="command-img-card">
            <img src="/images/flood_rescue_boat.jpg" alt="Flood Tactical Rescue Boat" />
            <div className="command-img-overlay">
              <span className="command-img-badge">TACTICAL FIELD UNIT</span>
              <h4 className="command-img-title">Flood Watercraft & Rescue Operations</h4>
              <span className="command-img-sub">Inflatable boats evacuating stranded families</span>
            </div>
          </div>
        </div>
      </section>

      {/* About Platform Band */}
      <section className="about-band" id="about">
        <div>
          <p className="section-label">ABOUT DISASTERREPORTAI</p>
          <h2>Turning field observations into clear, reviewable intelligence.</h2>
        </div>
        <p>
          DisasterReportAI bridges the critical gap between citizens on the ground and emergency officials in the control room. Text preprocessing, TF-IDF classification, geocoding, duplicate clustering, and explainable triage transform unstructured reports into actionable decision support.
        </p>
      </section>

      {/* Workflow Section */}
      <section className="workflow-section" id="workflow">
        <div className="section-heading">
          <p className="section-label">COMPLETE SYSTEM WORKFLOW</p>
          <h2>From citizen observation to official rescue order.</h2>
          <p>Explore how machine learning and human review collaborate at every stage.</p>
        </div>
        <div className="workflow-grid">
          {steps.map(([n, Icon, title, text, tone]) => (
            <article className={'workflow-card ' + tone + ' workflow-' + n} key={n}>
              <div className="workflow-image">
                <Icon size={36} />
                <span>{n}</span>
              </div>
              <div className="workflow-body">
                <h3>{title}</h3>
                <p>{text}</p>
                <span>Operational stage <ArrowRight size={17} /></span>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Intelligence & ML Engine */}
      <section className="intelligence" id="intelligence">
        <div className="intel-content">
          <p className="section-label on-dark">INTELLIGENT & EXPLAINABLE</p>
          <h2>Real-time ML models working with transparency.</h2>
          <p>
            Each submission undergoes text cleaning, entity extraction, HumAID classification, duplicate detection, and transparent severity scoring. Every priority score exposes the exact words and impact numbers contributing to triage.
          </p>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <Button kind="light" onClick={onSubmitReportClick}>Submit a report <ArrowRight size={16} /></Button>
          </div>
        </div>

        <div className="intel-grid">
          <div className="intel-card intel-1">
            <MessageSquareText />
            <b>Hazard Classification</b>
            <span>Trained on 53,000+ disaster records covering floods, storms, fires, and quakes.</span>
          </div>
          <div className="intel-card intel-2">
            <BellRing />
            <b>Explainable Severity Triage</b>
            <span>Trapped individuals, casualties, and urgent rescue triggers transparent scores.</span>
          </div>
          <div className="intel-card intel-3">
            <BarChart3 />
            <b>Duplicate Correlation</b>
            <span>Cosine similarity and geographic radius link related reports to unified incidents.</span>
          </div>
          <div className="intel-card intel-4">
            <ShieldCheck />
            <b>Official Authority Review</b>
            <span>Empowers officers to confirm location, assign response battalions, and resolve alerts.</span>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="contact">
        <a className="brand light" href="#home">
          <span className="brand-mark">D</span>Disaster<span>ReportAI</span>
        </a>
        <span>Emergency Decision Support · National Disaster Management System</span>
        <span>© 2026 DisasterReportAI · All Rights Reserved</span>
      </footer>
    </main>
  );
}

function Auth({ mode, go, onSession }) {
  const login = mode === 'login';
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    password: '',
    confirm: '',
    phone: '',
    role: 'CITIZEN',
    termsAccepted: false,
  });
  const [show, setShow] = useState(false);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  const change = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
  };

  async function submit(e) {
    e.preventDefault();
    setMessage('');
    if (!login && form.password !== form.confirm) return setMessage('Passwords do not match.');
    setBusy(true);

    try {
      await api.health();
      const s = login
        ? await api.login({ email: form.email, password: form.password })
        : await api.register({
            fullName: form.fullName,
            email: form.email,
            password: form.password,
            phone: form.phone,
            role: 'CITIZEN',
            termsAccepted: form.termsAccepted,
          });

      session.set(s);
      onSession(s);

      // Route based on user role
      if (s?.user?.role === 'AUTHORITY') {
        go('official-dashboard');
      } else {
        go('dashboard');
      }
    } catch (e) {
      setMessage(
        e.message === 'Failed to fetch'
          ? 'Application server is starting or unavailable. Check http://localhost:8080/api/health.'
          : e.message
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-backdrop" />
      <div className="auth-shade" />

      <section className="auth-intro">
        <a className="brand light" onClick={() => go('landing')}>
          <span className="brand-mark">D</span>Disaster<span>ReportAI</span>
        </a>
        <div>
          <h1>{login ? 'Welcome back.' : 'Be part of a better response.'}</h1>
          <p>
            {login
              ? 'Sign in to access your reports or enter the Disaster Management Command Center.'
              : 'Submit field reports, observe real-time AI summaries, and monitor official actions.'}
          </p>
        </div>
        <small>Decision-support intelligence · Not an unverified dispatch service</small>
      </section>

      <section className="auth-form-wrap">
        <button className="back" onClick={() => go('landing')}>← Back to home</button>

        <form className="auth-form" onSubmit={submit}>
          <p className="section-label">{login ? 'PORTAL ACCESS' : 'CREATE CITIZEN ACCOUNT'}</p>
          <h2>{login ? 'Sign in to your account.' : 'Start reporting responsibly.'}</h2>
          <p className="subtext">
            {login
              ? 'Authorized officials will enter the Command Center. Citizens enter their field workspace.'
              : 'Register your citizen account to submit field disaster reports and track official rescue actions.'}
          </p>

          <Notice type="error" message={message} />

          {!login && (
            <label>Full name *
              <input required name="fullName" value={form.fullName} onChange={change} placeholder="Enter your full name" />
            </label>
          )}

          <label>Email address *
            <input required type="email" name="email" value={form.email} onChange={change} placeholder="you@example.com" />
          </label>

          {!login && (
            <label>Phone number <small>optional</small>
              <input name="phone" value={form.phone} onChange={change} placeholder="+91 …" />
            </label>
          )}

          <label>Password *
            <div className="password">
              <input required minLength="8" type={show ? 'text' : 'password'} name="password" value={form.password} onChange={change} placeholder="At least 8 characters" />
              <button type="button" onClick={() => setShow(!show)}>{show ? 'Hide' : 'Show'}</button>
            </div>
          </label>

          {!login && (
            <>
              <label>Confirm password *
                <input required type="password" name="confirm" value={form.confirm} onChange={change} placeholder="Repeat your password" />
              </label>
              <label className="check">
                <input required type="checkbox" name="termsAccepted" checked={form.termsAccepted} onChange={change} />
                <span>I understand this platform provides automated decision-support intelligence for review.</span>
              </label>
            </>
          )}

          <Button kind="alert" disabled={busy} type="submit">
            {busy ? 'Verifying access…' : login ? 'Sign in' : 'Create account'} <ArrowRight size={16} />
          </Button>

          <p className="switch">
            {login ? 'New to DisasterReportAI?' : 'Already registered?'}
            <button type="button" onClick={() => go(login ? 'register' : 'login')}>
              {login ? 'Create an account' : 'Sign in'}
            </button>
          </p>
        </form>
      </section>
    </div>
  );
}

function CitizenDashboard({ go, current, onSession, initialTab = 'overview' }) {
  const [summary, setSummary] = useState(empty);
  const [reports, setReports] = useState([]);
  const [tab, setTab] = useState(initialTab);
  const [error, setError] = useState('');
  const [flashMessage, setFlashMessage] = useState('');

  useEffect(() => {
    setTab(initialTab);
  }, [initialTab]);

  const load = async () => {
    try {
      const [s, r] = await Promise.all([api.summary(), api.reports()]);
      setSummary(s);
      setReports(r);
    } catch (e) {
      setError(e.message);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const logout = () => {
    session.clear();
    onSession(null);
    go('landing');
  };

  const handleReportSaved = (msg) => {
    load();
    setFlashMessage(msg || 'Field report submitted successfully! AI/ML models processed the observation and notified officials.');
    setTab('history');
  };

  return (
    <div className="app-shell">
      <aside>
        <a className="brand light">
          <span className="brand-mark">D</span>Disaster<span>ReportAI</span>
        </a>
        <p className="side-label">CITIZEN WORKSPACE</p>
        {[
          ['overview', LayoutDashboard, 'Overview'],
          ['submit', ClipboardPenLine, 'Submit Report'],
          ['history', BarChart3, 'My Reports & Tracking'],
        ].map(([id, Icon, label]) => (
          <button key={id} onClick={() => setTab(id)} className={tab === id ? 'active' : ''}>
            <Icon size={18} />
            {label}
          </button>
        ))}

        <div className="side-bottom">
          <span><ShieldCheck size={14} /> Secure Citizen Account</span>
          <button onClick={logout}>Sign out <ArrowRight size={16} /></button>
        </div>
      </aside>

      <main className="dashboard">
        <header className="dash-header">
          <div>
            <p className="section-label">CITIZEN REPORTING WORKSPACE</p>
            <h1>Welcome, {(current?.user?.name || 'Citizen').split(' ')[0]}.</h1>
            <p>Track your submitted reports, live ML summaries, and official response updates.</p>
          </div>
          <Button kind="alert" onClick={() => setTab('submit')}>
            <Upload size={16} /> New Field Report
          </Button>
        </header>

        <Notice type="error" message={error} />
        <Notice type="info" message={flashMessage} />

        {tab === 'overview' && <Overview summary={summary} reports={reports} setTab={setTab} />}
        {tab === 'submit' && <ReportForm onSaved={handleReportSaved} />}
        {tab === 'history' && <CitizenHistory reports={reports} />}
      </main>
    </div>
  );
}

function Overview({ summary, reports, setTab }) {
  const stats = [
    ['Reports submitted', summary.total, 'Your field submissions'],
    ['Under AI analysis', summary.underAnalysis, 'Processing or ready'],
    ['Awaiting review', summary.review, 'With disaster management authorities'],
    ['Actions resolved', summary.resolved || 0, 'Completed emergency response'],
  ];

  const max = Math.max(1, ...Object.values(summary.categories || {}));

  return (
    <>
      <section className="stats">
        {stats.map(([label, value, small]) => (
          <article key={label}>
            <span>{label}</span>
            <strong>{value}</strong>
            <small>{small}</small>
          </article>
        ))}
      </section>

      <section className="dash-grid">
        <article className="chart-card">
          <div className="card-title">
            <div>
              <p className="section-label">DETECTED DISASTER CATEGORIES</p>
              <h3>Live Incident Distribution</h3>
            </div>
            <BarChart3 />
          </div>
          {Object.keys(summary.categories || {}).length ? (
            <div className="bars">
              {Object.entries(summary.categories).map(([name, count]) => (
                <div key={name}>
                  <span>{name.replaceAll('_', ' ')}</span>
                  <i><b style={{ width: (count / max) * 100 + '%' }} /></i>
                  <em>{count}</em>
                </div>
              ))}
            </div>
          ) : (
            <Empty icon={<BarChart3 />} text="Submit a report to populate your live category distribution." />
          )}
        </article>

        <article className="priority-card">
          <p className="section-label on-dark">AUTOMATED REVIEW PRIORITY</p>
          <h3>Urgency Signals</h3>
          <div className="priority-list">
            {['high', 'medium', 'low'].map((x) => (
              <div key={x}>
                <span className={x} />
                {x}
                <b>{summary.priorities?.[x] || 0}</b>
              </div>
            ))}
          </div>
          <p>Priority is an explainable decision-support signal for emergency authorities.</p>
        </article>
      </section>

      <section className="history-card">
        <div className="card-title">
          <div>
            <p className="section-label">RECENT REPORTS</p>
            <h3>Latest Submissions</h3>
          </div>
          <button onClick={() => setTab('history')}>View all <ChevronRight size={16} /></button>
        </div>
        {reports.length ? <CitizenHistory reports={reports.slice(0, 4)} compact /> : <Empty icon={<ClipboardPenLine />} text="Your submitted reports will appear here." />}
      </section>
    </>
  );
}

function Empty({ icon, text }) {
  return (
    <div className="empty">
      {icon}
      <p>{text}</p>
    </div>
  );
}

function CitizenHistory({ reports, compact = false }) {
  const [expandedId, setExpandedId] = useState(null);

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <section className={compact ? '' : 'history-card full'}>
      {!compact && (
        <div className="card-title" style={{ marginBottom: '20px' }}>
          <div>
            <p className="section-label">CITIZEN STATUS TRACKER</p>
            <h3>My Reports & Official Directives</h3>
          </div>
          <span style={{ fontSize: '12px', color: '#64748b' }}>{reports.length} total submitted</span>
        </div>
      )}

      {reports.length ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {reports.map((r) => {
            const isExpanded = expandedId === r.id;
            const officialStatus = (r.officialStatus || 'AWAITING_REVIEW').toUpperCase();

            // Calculate stepper progress (1 to 5)
            let step = 2; // Submitted + AI Analyzed
            if (officialStatus === 'AWAITING_REVIEW') step = 3;
            else if (officialStatus === 'UNDER_REVIEW') step = 3;
            else if (officialStatus === 'ACTION_RECORDED') step = 4;
            else if (officialStatus === 'RESOLVED') step = 5;

            return (
              <div
                key={r.id}
                style={{
                  background: '#ffffff',
                  border: '1px solid #dce4ec',
                  borderRadius: '6px',
                  padding: '18px 20px',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
                }}
              >
                {/* Header Row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', cursor: 'pointer' }} onClick={() => toggleExpand(r.id)}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <span style={{ fontSize: '12px', fontWeight: 800, color: '#0c4d9d' }}>{r.id}</span>
                      <span className="category-chip" style={{ fontSize: '11px', padding: '2px 8px' }}>
                        {r.analysis?.category ? r.analysis.category.replace('_', ' ') : r.reportedCategory || 'Disaster'}
                      </span>
                      <span style={{ fontSize: '11px', color: '#647489' }}>
                        <MapPin size={11} style={{ display: 'inline', verticalAlign: '-1px', marginRight: '3px' }} />
                        {r.location}
                      </span>
                    </div>
                    <h4 style={{ margin: 0, fontSize: '16px', color: '#062b5a', fontWeight: 700 }}>
                      {r.title}
                    </h4>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      padding: '4px 10px',
                      borderRadius: '12px',
                      background: officialStatus === 'RESOLVED' ? '#ecfdf5' : officialStatus === 'ACTION_RECORDED' ? '#e0f2fe' : '#fef3c7',
                      color: officialStatus === 'RESOLVED' ? '#047857' : officialStatus === 'ACTION_RECORDED' ? '#0369a1' : '#b45309',
                    }}>
                      {officialStatus.replace('_', ' ')}
                    </span>
                    <button style={{ background: 'none', border: 'none', color: '#647489', cursor: 'pointer' }}>
                      <ChevronRight size={18} style={{ transform: isExpanded ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }} />
                    </button>
                  </div>
                </div>

                {/* 5-Step Visual Lifecycle Stepper */}
                <div className="report-stepper">
                  {[
                    ['Submitted', 1],
                    ['AI Analyzed', 2],
                    ['Officer Review', 3],
                    ['Team Dispatched', 4],
                    ['Resolved', 5],
                  ].map(([label, sIdx]) => (
                    <div
                      key={sIdx}
                      className={`stepper-step ${sIdx < step ? 'completed' : sIdx === step ? 'active' : ''}`}
                    >
                      <div className="stepper-circle">
                        {sIdx < step ? <Check size={14} /> : sIdx}
                      </div>
                      <span className="stepper-label">{label}</span>
                    </div>
                  ))}
                </div>

                {/* Expanded Details Section */}
                {isExpanded && (
                  <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #e9edf2', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    {/* Reporter's Submission */}
                    <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '6px', fontSize: '12px' }}>
                      <div style={{ fontWeight: 700, color: '#0c4d9d', marginBottom: '6px' }}>YOUR FIELD SUBMISSION:</div>
                      <p style={{ margin: '0 0 10px', color: '#334155', lineHeight: '1.5' }}>"{r.description}"</p>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', color: '#64748b' }}>
                        <div>Affected: <b style={{ color: '#0f172a' }}>{r.affectedPeople || 'Unspecified'}</b></div>
                        <div>Trapped: <b style={{ color: '#ef4444' }}>{r.trappedPeople || 'None'}</b></div>
                        <div>Injured: <b style={{ color: '#f97316' }}>{r.injuredPeople || 'None'}</b></div>
                        <div>Landmark: <b style={{ color: '#0f172a' }}>{r.landmark || 'None'}</b></div>
                      </div>
                    </div>

                    {/* Official Response & AI Summary */}
                    <div style={{ background: '#f0f9ff', border: '1px solid #bae6fd', padding: '14px', borderRadius: '6px', fontSize: '12px' }}>
                      <div style={{ fontWeight: 700, color: '#0369a1', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Shield size={14} /> OFFICIAL STATUS & RESPONSE ACTION:
                      </div>

                      <div style={{ marginBottom: '8px' }}>
                        <span style={{ color: '#64748b' }}>Assigned Battalion:</span>{' '}
                        <b style={{ color: '#0369a1' }}>{r.assignedTeam || 'Pending review by command center'}</b>
                      </div>

                      {r.officialRemarks && (
                        <div style={{ background: '#ffffff', border: '1px solid #e0f2fe', padding: '8px 10px', borderRadius: '4px', marginBottom: '8px' }}>
                          <span style={{ fontSize: '11px', fontWeight: 700, color: '#0369a1' }}>OFFICIAL DIRECTIVE:</span>
                          <p style={{ margin: '3px 0 0', color: '#1e293b' }}>{r.officialRemarks}</p>
                        </div>
                      )}

                      {r.analysis?.summary && (
                        <div style={{ fontSize: '11px', color: '#475569', lineHeight: '1.4' }}>
                          <b>AI Incident Synthesis:</b> {r.analysis.summary}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <Empty icon={<ClipboardPenLine />} text="No reports have been submitted yet." />
      )}
    </section>
  );
}

function ReportForm({ onSaved }) {
  const [form, setForm] = useState({
    title: '',
    description: '',
    reportedCategory: 'Flood',
    locationText: '',
    landmark: '',
    incidentAt: new Date().toISOString().slice(0, 16),
    affectedPeople: '',
    injuredPeople: '',
    trappedPeople: '',
    resources: '',
    hasImage: false,
    hasAudio: false,
  });

  const [files, setFiles] = useState({ image: '', audio: '' });
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  const change = (e) => {
    const { name, value, type, checked, files: up } = e.target;
    if (up) {
      setFiles((f) => ({ ...f, [name]: up[0]?.name || '' }));
      setForm((f) => ({ ...f, [name === 'image' ? 'hasImage' : 'hasAudio']: !!up[0] }));
      return;
    }
    setForm((f) => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
  };

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setMessage('');
    try {
      const r = await api.createReport({
        ...form,
        affectedPeople: num(form.affectedPeople),
        injuredPeople: num(form.injuredPeople),
        trappedPeople: num(form.trappedPeople),
      });
      if (onSaved) {
        onSaved(r.message || 'Report submitted and processed by AI/ML models successfully!');
      }
    } catch (e) {
      setMessage(e.message || 'Failed to submit report. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="report-form-panel">
      <div className="form-intro">
        <p className="section-label">NEW FIELD REPORT</p>
        <h2>Share what you observe.</h2>
        <p>Required fields preserve your original observation. Information is forwarded to ML models and disaster authorities.</p>

        <div className="safety-note" style={{ marginTop: '24px' }}>
          <ShieldCheck /> Submitted reports reach the Disaster Management Authority control room for triage and rescue dispatch.
        </div>
      </div>

      <form onSubmit={submit}>
        <Notice type={message.includes('error') || message.includes('failed') ? 'error' : 'info'} message={message} />

        <div className="form-grid">
          <label className="wide">Report title *
            <input required name="title" value={form.title} onChange={change} placeholder="e.g. Severe waterlogging and trapped residents" />
          </label>

          <label>Observed disaster category *
            <select name="reportedCategory" value={form.reportedCategory} onChange={change}>
              {['Flood', 'Fire', 'Earthquake', 'Cyclone / Storm', 'Infrastructure damage', 'Other'].map((x) => (
                <option key={x} value={x}>{x}</option>
              ))}
            </select>
          </label>

          <label>Incident date & time *
            <input required type="datetime-local" name="incidentAt" value={form.incidentAt} onChange={change} />
          </label>

          <label className="wide">What happened? (Detailed observation) *
            <textarea required minLength="8" name="description" value={form.description} onChange={change} placeholder="Describe the water level, danger, houses flooded, trapped residents, or assistance needed." />
          </label>

          <label>Incident location *
            <input required name="locationText" value={form.locationText} onChange={change} placeholder="Village, town, district, or street (e.g. Velachery, Chennai)" />
          </label>

          <label>Landmark
            <input name="landmark" value={form.landmark} onChange={change} placeholder="Bridge, school, temple, highway mile" />
          </label>

          <label>Affected people count
            <input min="0" type="number" name="affectedPeople" value={form.affectedPeople} onChange={change} placeholder="e.g. 12" />
          </label>

          <label>Trapped people count
            <input min="0" type="number" name="trappedPeople" value={form.trappedPeople} onChange={change} placeholder="e.g. 4" />
          </label>

          <label>Injured people count
            <input min="0" type="number" name="injuredPeople" value={form.injuredPeople} onChange={change} placeholder="e.g. 0" />
          </label>

          <label className="wide">Emergency resources requested
            <textarea name="resources" value={form.resources} onChange={change} placeholder="Rescue boats, de-watering pumps, evacuation vehicles, food kits, medical assistance…" />
          </label>
        </div>

        <div className="upload-row">
          <label>
            <ImageIcon />
            <span><b>Supporting image</b><small>{files.image || 'JPG/PNG evidence photo'}</small></span>
            <input type="file" name="image" accept="image/*" onChange={change} />
          </label>

          <label>
            <FileAudio />
            <span><b>Audio reference</b><small>{files.audio || 'Optional voice report'}</small></span>
            <input type="file" name="audio" accept="audio/*" onChange={change} />
          </label>
        </div>

        <Button kind="alert" disabled={busy} type="submit">
          {busy ? 'Processing report with ML models…' : 'Submit field report'} <ArrowRight size={16} />
        </Button>
      </form>
    </section>
  );
}

function num(v) {
  return v === '' ? null : Number(v);
}

export default function App() {
  const [page, setPage] = useState('landing');
  const [current, setCurrent] = useState(session.get());
  const [initialCitizenTab, setInitialCitizenTab] = useState('overview');

  const handleOpenOfficial = () => {
    const s = session.get();
    if (s?.user?.role === 'AUTHORITY') {
      setPage('official-dashboard');
    } else {
      setPage('login');
    }
  };

  const handleSubmitReportClick = () => {
    const s = session.get();
    if (s?.user) {
      if (s.user.role === 'AUTHORITY') {
        setPage('official-dashboard');
      } else {
        setInitialCitizenTab('submit');
        setPage('dashboard');
      }
    } else {
      setPage('login');
    }
  };

  if (page === 'login' || page === 'register') {
    return (
      <Auth
        mode={page}
        go={setPage}
        onSession={(userSession) => {
          setCurrent(userSession);
        }}
      />
    );
  }

  if (page === 'official-dashboard') {
    return (
      <OfficialDashboard
        current={current}
        onLogout={() => {
          session.clear();
          setCurrent(null);
          setPage('landing');
        }}
        onSwitchToCitizen={() => {
          setInitialCitizenTab('overview');
          setPage('dashboard');
        }}
      />
    );
  }

  if (page === 'dashboard') {
    return (
      <CitizenDashboard
        go={setPage}
        current={current}
        onSession={setCurrent}
        initialTab={initialCitizenTab}
      />
    );
  }

  return (
    <Landing
      go={setPage}
      onOfficialDirect={handleOpenOfficial}
      onSubmitReportClick={handleSubmitReportClick}
    />
  );
}
