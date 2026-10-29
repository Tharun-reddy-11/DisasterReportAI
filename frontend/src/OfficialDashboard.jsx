import { useState, useEffect } from 'react';
import {
  Shield, AlertTriangle, Activity, Users, Radio, Navigation, CheckCircle2,
  Clock, MapPin, Eye, FileText, ChevronRight, Layers, ArrowRight, RefreshCw,
  Search, Filter, Send, Phone, Siren, Flame, Waves, Wind, Mountain, Building2,
  Check, X, CheckSquare, Sparkles, AlertCircle
} from 'lucide-react';
import {
  ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar,
  AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, Legend
} from 'recharts';
import { api } from './api';
import LeafletMap from './LeafletMap';

const DISASTER_COLORS = {
  Flood: '#0284c7',
  Fire: '#ea580c',
  'Cyclone / Storm': '#0d9488',
  Earthquake: '#e11d48',
  Infrastructure: '#d97706',
  Other: '#64748b',
};

const TEAMS_LIST = [
  'NDRF 4th Battalion Flood Cell',
  'NDRF 10th Battalion Tactical Unit',
  'SDRF Quick Response Water Rescue Squad',
  'SDRF Urban Evacuation Unit',
  'State Fire & Emergency Services',
  'District Medical Emergency Response Team',
  'Civil Defence & Debris Clearance Squad',
  'Municipal High-Capacity Dewatering Cell',
];

export default function OfficialDashboard({ current, onLogout, onSwitchToCitizen }) {
  const [stats, setStats] = useState({
    totalReports: 0, awaitingReview: 0, activeIncidents: 0,
    criticalPriority: 0, teamsDispatched: 0, totalAffectedCitizens: 0, verifiedRate: 0
  });
  const [reports, setReports] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [markers, setMarkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Active view tab: overview, reports, incidents, map
  const [activeTab, setActiveTab] = useState('overview');

  // Selected incident/report for review drawer
  const [selectedItem, setSelectedItem] = useState(null);
  const [reviewForm, setReviewForm] = useState({
    status: 'ACTION_RECORDED',
    assignedTeam: TEAMS_LIST[0],
    officialRemarks: '',
    priorityOverride: 'high',
    verified: true,
  });
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState('');

  // Search & filter
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const loadData = async () => {
    try {
      const [sData, rData, iData, aData, mData] = await Promise.all([
        api.officialStats().catch(() => ({})),
        api.officialReports().catch(() => []),
        api.officialIncidents().catch(() => []),
        api.officialAnalytics().catch(() => null),
        api.officialMapMarkers().catch(() => []),
      ]);

      setStats(sData || {});
      setReports(rData || []);
      setIncidents(iData || []);
      setAnalytics(aData || null);
      setMarkers(mData || []);
    } catch (err) {
      console.error('Failed to load real-time official data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(() => {
      loadData();
    }, 15000); // 15s live refresh
    return () => clearInterval(interval);
  }, []);

  const handleOpenReview = (item) => {
    setSelectedItem(item);
    setReviewSuccess('');
    setReviewForm({
      status: item.officialStatus || item.status || 'UNDER_REVIEW',
      assignedTeam: item.assignedTeam || TEAMS_LIST[0],
      officialRemarks: item.officialRemarks || '',
      priorityOverride: item.analysis?.priority || item.priority || 'high',
      verified: !!item.verified,
    });
  };

  const handleSaveReview = async (e) => {
    e.preventDefault();
    if (!selectedItem) return;
    setReviewSubmitting(true);
    setReviewSuccess('');

    try {
      await api.officialReview({
        reportId: selectedItem.publicId || selectedItem.id,
        incidentCode: selectedItem.incidentCode,
        status: reviewForm.status,
        assignedTeam: reviewForm.assignedTeam,
        officialRemarks: reviewForm.officialRemarks,
        priorityOverride: reviewForm.priorityOverride,
        verified: reviewForm.verified,
      });

      setReviewSuccess('Official orders and response update recorded in real-time!');
      await loadData();
      setTimeout(() => {
        setSelectedItem(null);
      }, 1500);
    } catch (err) {
      alert('Error updating review: ' + err.message);
    } finally {
      setReviewSubmitting(false);
    }
  };

  // Filtered reports
  const filteredReports = reports.filter((r) => {
    const matchesSearch =
      (r.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.location || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.id || '').toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory =
      categoryFilter === 'ALL' ||
      (r.analysis?.category || r.reportedCategory || '').toLowerCase().includes(categoryFilter.toLowerCase());

    const matchesStatus =
      statusFilter === 'ALL' ||
      (r.officialStatus || r.status || '').toUpperCase() === statusFilter.toUpperCase();

    return matchesSearch && matchesCategory && matchesStatus;
  });

  const activeThreats = reports.filter(
    (r) =>
      (r.analysis?.priority === 'high' || (r.analysis?.severityScore && r.analysis.severityScore >= 65)) &&
      r.officialStatus !== 'RESOLVED'
  );

  return (
    <div className="official-command-center" style={{ minHeight: '100vh', background: '#071224', color: '#e2e8f0', fontFamily: "'DM Sans', sans-serif" }}>
      {/* Top Header */}
      <header style={{
        height: '68px',
        borderBottom: '1px solid #1e293b',
        background: '#091830',
        padding: '0 28px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 50,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: '38px',
            height: '38px',
            borderRadius: '8px',
            background: 'linear-gradient(135deg, #0284c7, #0369a1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontWeight: 800,
            fontSize: '18px',
            boxShadow: '0 0 15px rgba(2, 132, 199, 0.5)'
          }}>
            <Shield size={22} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '15px', fontWeight: 800, letterSpacing: '0.6px', color: '#f8fafc' }}>
                DISASTER OPERATIONS COMMAND CENTER
              </span>
              <span style={{
                background: '#0284c7',
                color: '#fff',
                fontSize: '10px',
                fontWeight: 700,
                padding: '2px 7px',
                borderRadius: '10px',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                NDMA / SDMA TIER-1
              </span>
            </div>
            <p style={{ margin: 0, fontSize: '11px', color: '#94a3b8' }}>
              Live AI Field Report Processing & Emergency Decision-Support Portal
            </p>
          </div>
        </div>

        {/* Live Status Telemetry & Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'rgba(16, 185, 129, 0.12)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            padding: '5px 12px',
            borderRadius: '20px',
            fontSize: '11px',
            color: '#34d399',
            fontWeight: 600,
          }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 8px #10b981' }} className="pulse-indicator"></span>
            LIVE RADAR & ML INFERENCE ONLINE
          </div>

          <button
            onClick={() => { setRefreshing(true); loadData(); }}
            style={{
              background: '#1e293b',
              color: '#94a3b8',
              border: '1px solid #334155',
              padding: '6px 12px',
              borderRadius: '5px',
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer',
            }}
          >
            <RefreshCw size={14} className={refreshing ? 'spin-icon' : ''} /> Refresh
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', paddingLeft: '10px', borderLeft: '1px solid #334155' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#f1f5f9' }}>{current?.user?.name || 'Duty Official'}</div>
              <div style={{ fontSize: '10px', color: '#64748b' }}>Authorized Official</div>
            </div>
            <button
              onClick={onLogout}
              style={{
                background: '#dc2626',
                color: '#fff',
                border: 'none',
                padding: '6px 12px',
                borderRadius: '5px',
                fontSize: '11px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Dynamic Status Advisory Banner */}
      <div style={{
        background: activeThreats.length > 0 ? 'linear-gradient(90deg, #991b1b, #7f1d1d)' : '#0f274a',
        padding: '7px 28px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        fontSize: '12px',
        color: '#fef2f2',
        fontWeight: 600,
        letterSpacing: '0.3px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Siren size={16} />
          <span>
            {activeThreats.length > 0
              ? `ACTIVE EMERGENCY ALERT: ${activeThreats.length} urgent/high-priority disaster incident(s) require official attention.`
              : 'DISASTER MONITORING ACTIVE: All operational sectors normal. Real-time ML inference ready for incoming field reports.'}
          </span>
        </div>
        <span style={{ opacity: 0.85, fontSize: '11px' }}>
          Real-time End-to-End Decision Support
        </span>
      </div>

      {/* Main Container */}
      <div style={{ padding: '24px 28px' }}>
        {/* Real-time KPI Metrics Row */}
        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '14px', marginBottom: '22px' }}>
          {[
            { label: 'Total Field Reports', value: reports.length, sub: 'Real-time submissions', color: '#0284c7', icon: FileText },
            { label: 'Critical / Urgent Triage', value: reports.filter((r) => r.analysis?.priority === 'high').length, sub: 'High risk / Trapped', color: '#ef4444', icon: AlertTriangle },
            { label: 'Awaiting Official Review', value: reports.filter((r) => (r.officialStatus || '').toUpperCase() === 'AWAITING_REVIEW').length, sub: 'Pending officer action', color: '#f59e0b', icon: Clock },
            { label: 'Active Incidents', value: incidents.length || stats.activeIncidents || 0, sub: 'Correlated clusters', color: '#8b5cf6', icon: Radio },
            { label: 'Teams Dispatched', value: reports.filter((r) => r.assignedTeam && r.assignedTeam !== 'None assigned').length, sub: 'Active response units', color: '#10b981', icon: Shield },
            { label: 'Reported Impact', value: `${reports.reduce((acc, r) => acc + (r.affectedPeople || 0), 0)} Citizens`, sub: 'Real reported count', color: '#38bdf8', icon: Users },
          ].map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                style={{
                  background: '#0d1d36',
                  border: '1px solid #1e293b',
                  borderRadius: '8px',
                  padding: '16px 18px',
                  borderTop: `4px solid ${item.color}`,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', color: '#94a3b8', fontSize: '11px', fontWeight: 600 }}>
                  <span>{item.label}</span>
                  <Icon size={16} style={{ color: item.color }} />
                </div>
                <div style={{ fontSize: '26px', fontWeight: 800, color: '#f8fafc', margin: '8px 0 2px' }}>
                  {item.value}
                </div>
                <div style={{ fontSize: '11px', color: '#64748b' }}>{item.sub}</div>
              </div>
            );
          })}
        </section>

        {/* Command Navigation Tabs */}
        <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid #1e293b', paddingBottom: '12px', marginBottom: '20px' }}>
          {[
            ['overview', 'Command Overview & Telemetry', Activity],
            ['reports', `All Field Reports (${reports.length})`, FileText],
            ['incidents', `Incident Intelligence & Clusters (${incidents.length})`, Radio],
            ['map', 'Full Tactical Map Room', Navigation],
          ].map(([id, label, Icon]) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '9px 18px',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: 700,
                border: 'none',
                cursor: 'pointer',
                background: activeTab === id ? '#0284c7' : '#0d1d36',
                color: activeTab === id ? '#ffffff' : '#94a3b8',
                boxShadow: activeTab === id ? '0 0 12px rgba(2, 132, 199, 0.4)' : 'none',
                transition: 'all 0.2s',
              }}
            >
              <Icon size={16} />
              {label}
            </button>
          ))}
        </div>

        {/* TAB 1: COMMAND OVERVIEW */}
        {activeTab === 'overview' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1.25fr 0.95fr', gap: '20px' }}>
            {/* Left Column: Live Map + Live Triage Stream */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ background: '#0d1d36', border: '1px solid #1e293b', borderRadius: '8px', padding: '18px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#f8fafc' }}>
                      Live Geographic Hazard Overlay
                    </h3>
                    <p style={{ margin: 0, fontSize: '12px', color: '#94a3b8' }}>
                      Real-time OpenStreetMap with geocoded disaster pin coordinates
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveTab('map')}
                    style={{ background: 'transparent', color: '#38bdf8', border: 'none', fontSize: '12px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                  >
                    Expand Map <ChevronRight size={14} />
                  </button>
                </div>

                <LeafletMap
                  markers={markers}
                  onSelectIncident={(m) => {
                    const rep = reports.find((r) => r.id === m.id);
                    if (rep) handleOpenReview(rep);
                    else handleOpenReview(m);
                  }}
                  height="420px"
                />
              </div>

              {/* Real-time High Urgency Triage Feed */}
              <div style={{ background: '#0d1d36', border: '1px solid #1e293b', borderRadius: '8px', padding: '18px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                  <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <AlertTriangle size={18} style={{ color: '#ef4444' }} /> High Urgency Triage Feed
                  </h3>
                  <span style={{ fontSize: '11px', color: '#64748b' }}>Action required by duty officer</span>
                </div>

                {reports.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '24px 10px', color: '#64748b', fontSize: '12px' }}>
                    No incoming disaster reports currently awaiting review. Real-time reports will stream here instantly upon citizen submission.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {reports.slice(0, 4).map((r) => (
                      <div
                        key={r.id}
                        style={{
                          background: '#071427',
                          border: '1px solid #1e293b',
                          borderRadius: '6px',
                          padding: '12px 14px',
                          display: 'grid',
                          gridTemplateColumns: '1fr auto',
                          gap: '12px',
                          alignItems: 'center',
                        }}
                      >
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                            <span style={{ fontSize: '11px', fontWeight: 700, color: '#38bdf8' }}>{r.id}</span>
                            <span style={{
                              fontSize: '10px',
                              fontWeight: 700,
                              padding: '2px 6px',
                              borderRadius: '4px',
                              background: r.analysis?.priority === 'high' ? '#7f1d1d' : '#1e293b',
                              color: r.analysis?.priority === 'high' ? '#fca5a5' : '#94a3b8',
                              textTransform: 'uppercase'
                            }}>
                              {r.analysis?.priority || 'NORMAL'}
                            </span>
                            <span style={{ fontSize: '11px', color: '#64748b' }}>
                              <MapPin size={11} style={{ display: 'inline', verticalAlign: '-1px', marginRight: '3px' }} />
                              {r.location}
                            </span>
                          </div>
                          <div style={{ fontSize: '13px', fontWeight: 700, color: '#f1f5f9' }}>{r.title}</div>
                          <p style={{ margin: '4px 0 0', fontSize: '11px', color: '#94a3b8', display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                            {r.description}
                          </p>
                        </div>

                        <button
                          onClick={() => handleOpenReview(r)}
                          style={{
                            background: '#0284c7',
                            color: '#fff',
                            border: 'none',
                            padding: '7px 12px',
                            borderRadius: '4px',
                            fontSize: '11px',
                            fontWeight: 700,
                            cursor: 'pointer',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          Review & Order →
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Visual Charts (Recharts) */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Pie Chart: Disaster Category Distribution */}
              <div style={{ background: '#0d1d36', border: '1px solid #1e293b', borderRadius: '8px', padding: '18px' }}>
                <h3 style={{ margin: '0 0 4px', fontSize: '15px', fontWeight: 700, color: '#f8fafc' }}>
                  Disaster Category Distribution
                </h3>
                <p style={{ margin: '0 0 12px', fontSize: '11px', color: '#94a3b8' }}>
                  NLP Classified Hazards from HumAID trained models
                </p>

                {reports.length > 0 && analytics?.categoryDistribution?.some((c) => c.value > 0) ? (
                  <div style={{ height: '220px', width: '100%' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={analytics.categoryDistribution.filter((c) => c.value > 0)}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          innerRadius={55}
                          outerRadius={80}
                          paddingAngle={3}
                        >
                          {analytics.categoryDistribution.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color || '#64748b'} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{ background: '#071427', border: '1px solid #334155', borderRadius: '6px', fontSize: '12px' }}
                          itemStyle={{ color: '#e2e8f0' }}
                        />
                        <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '6px' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div style={{ height: '180px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#64748b', fontSize: '12px', textAlign: 'center' }}>
                    <Activity size={28} style={{ color: '#0284c7', marginBottom: '8px', opacity: 0.6 }} />
                    <span>Awaiting field report submissions to populate live category pie chart.</span>
                  </div>
                )}
              </div>

              {/* Bar Chart: Priority Breakdown */}
              <div style={{ background: '#0d1d36', border: '1px solid #1e293b', borderRadius: '8px', padding: '18px' }}>
                <h3 style={{ margin: '0 0 4px', fontSize: '15px', fontWeight: 700, color: '#f8fafc' }}>
                  Incident Triage Priority Levels
                </h3>
                <p style={{ margin: '0 0 12px', fontSize: '11px', color: '#94a3b8' }}>
                  Calculated using transparent urgency signals and victim numbers
                </p>

                {reports.length > 0 && analytics?.priorityDistribution ? (
                  <div style={{ height: '180px', width: '100%' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={analytics.priorityDistribution}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                        <XAxis dataKey="priority" stroke="#64748b" fontSize={11} />
                        <YAxis stroke="#64748b" fontSize={11} />
                        <Tooltip
                          contentStyle={{ background: '#071427', border: '1px solid #334155', borderRadius: '6px', fontSize: '12px' }}
                        />
                        <Bar dataKey="count" fill="#0284c7" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div style={{ height: '160px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#64748b', fontSize: '12px', textAlign: 'center' }}>
                    <span>Triage priority counts will update when reports arrive.</span>
                  </div>
                )}
              </div>

              {/* Area Chart: Incoming Reports Trend */}
              <div style={{ background: '#0d1d36', border: '1px solid #1e293b', borderRadius: '8px', padding: '18px' }}>
                <h3 style={{ margin: '0 0 4px', fontSize: '15px', fontWeight: 700, color: '#f8fafc' }}>
                  Reports Inflow Timeline
                </h3>
                <p style={{ margin: '0 0 12px', fontSize: '11px', color: '#94a3b8' }}>
                  Live submission time series
                </p>

                {reports.length > 0 && analytics?.timeline ? (
                  <div style={{ height: '160px', width: '100%' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={analytics.timeline}>
                        <defs>
                          <linearGradient id="colorReports" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.7} />
                            <stop offset="95%" stopColor="#38bdf8" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                        <XAxis dataKey="time" stroke="#64748b" fontSize={11} />
                        <YAxis stroke="#64748b" fontSize={11} />
                        <Tooltip
                          contentStyle={{ background: '#071427', border: '1px solid #334155', borderRadius: '6px', fontSize: '12px' }}
                        />
                        <Area type="monotone" dataKey="reports" stroke="#38bdf8" fillOpacity={1} fill="url(#colorReports)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div style={{ height: '140px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#64748b', fontSize: '12px', textAlign: 'center' }}>
                    <span>Timeline graph ready for live telemetry.</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: ALL REPORTS TABLE */}
        {activeTab === 'reports' && (
          <div style={{ background: '#0d1d36', border: '1px solid #1e293b', borderRadius: '8px', padding: '20px' }}>
            {/* Filter & Search Bar */}
            <div style={{ display: 'flex', gap: '12px', marginBottom: '18px', flexWrap: 'wrap', alignItems: 'center' }}>
              <div style={{ position: 'relative', flex: 1, minWidth: '260px' }}>
                <Search size={16} style={{ position: 'absolute', left: '12px', top: '10px', color: '#64748b' }} />
                <input
                  type="text"
                  placeholder="Search by report ID, location, title, or landmark..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{
                    width: '100%',
                    background: '#071427',
                    border: '1px solid #1e293b',
                    borderRadius: '6px',
                    padding: '8px 12px 8px 36px',
                    color: '#fff',
                    fontSize: '13px',
                  }}
                />
              </div>

              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                style={{ background: '#071427', border: '1px solid #1e293b', color: '#e2e8f0', padding: '8px 12px', borderRadius: '6px', fontSize: '12px' }}
              >
                <option value="ALL">All Categories</option>
                <option value="flood">Flood</option>
                <option value="fire">Fire</option>
                <option value="cyclone">Cyclone / Storm</option>
                <option value="earthquake">Earthquake</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{ background: '#071427', border: '1px solid #1e293b', color: '#e2e8f0', padding: '8px 12px', borderRadius: '6px', fontSize: '12px' }}
              >
                <option value="ALL">All Statuses</option>
                <option value="AWAITING_REVIEW">Awaiting Review</option>
                <option value="UNDER_REVIEW">Under Review</option>
                <option value="ACTION_RECORDED">Action Dispatched</option>
                <option value="RESOLVED">Resolved</option>
              </select>
            </div>

            {/* Table */}
            {filteredReports.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: '#64748b', fontSize: '13px' }}>
                <FileText size={32} style={{ color: '#0284c7', margin: '0 auto 10px', display: 'block', opacity: 0.6 }} />
                No citizen field reports match current filter criteria. Submitted reports will display here in real-time.
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #1e293b', color: '#64748b', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
                      <th style={{ padding: '12px' }}>Report ID</th>
                      <th style={{ padding: '12px' }}>Incident & Location</th>
                      <th style={{ padding: '12px' }}>AI Category & Conf.</th>
                      <th style={{ padding: '12px' }}>Impact (T / I / A)</th>
                      <th style={{ padding: '12px' }}>Priority</th>
                      <th style={{ padding: '12px' }}>Official Status</th>
                      <th style={{ padding: '12px' }}>Assigned Unit</th>
                      <th style={{ padding: '12px', textAlign: 'right' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredReports.map((r) => {
                      const isCritical = r.analysis?.priority === 'high' || (r.analysis?.severityScore && r.analysis.severityScore >= 65);
                      return (
                        <tr key={r.id} style={{ borderBottom: '1px solid #14233c', transition: 'background 0.15s' }} className="table-row-hover">
                          <td style={{ padding: '12px', fontWeight: 700, color: '#38bdf8' }}>
                            {r.id}
                          </td>
                          <td style={{ padding: '12px' }}>
                            <div style={{ fontWeight: 700, color: '#f1f5f9', marginBottom: '2px' }}>{r.title}</div>
                            <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                              <MapPin size={11} style={{ display: 'inline', verticalAlign: '-1px', marginRight: '3px' }} />
                              {r.location} {r.landmark ? `(${r.landmark})` : ''}
                            </div>
                          </td>
                          <td style={{ padding: '12px' }}>
                            <span style={{
                              display: 'inline-block',
                              background: '#0284c7',
                              color: '#fff',
                              fontSize: '11px',
                              fontWeight: 600,
                              padding: '3px 8px',
                              borderRadius: '4px',
                              textTransform: 'capitalize'
                            }}>
                              {r.analysis?.category ? r.analysis.category.replace('_', ' ') : r.reportedCategory || 'Disaster'}
                            </span>
                            {r.analysis?.confidence && (
                              <span style={{ fontSize: '11px', color: '#64748b', marginLeft: '6px' }}>
                                {Math.round(r.analysis.confidence * 100)}%
                              </span>
                            )}
                          </td>
                          <td style={{ padding: '12px' }}>
                            <span style={{ color: '#ef4444', fontWeight: 700 }}>{r.trappedPeople || 0}</span> /{' '}
                            <span style={{ color: '#f97316', fontWeight: 700 }}>{r.injuredPeople || 0}</span> /{' '}
                            <span style={{ color: '#38bdf8', fontWeight: 700 }}>{r.affectedPeople || 0}</span>
                          </td>
                          <td style={{ padding: '12px' }}>
                            <span style={{
                              fontSize: '11px',
                              fontWeight: 700,
                              padding: '3px 8px',
                              borderRadius: '12px',
                              background: isCritical ? '#7f1d1d' : '#1e293b',
                              color: isCritical ? '#fca5a5' : '#94a3b8',
                              textTransform: 'uppercase'
                            }}>
                              {r.analysis?.priority || 'NORMAL'}
                            </span>
                          </td>
                          <td style={{ padding: '12px' }}>
                            <span style={{
                              fontSize: '11px',
                              fontWeight: 700,
                              padding: '3px 8px',
                              borderRadius: '4px',
                              background: r.officialStatus === 'RESOLVED' ? '#064e3b' : r.officialStatus === 'ACTION_RECORDED' ? '#075985' : '#78350f',
                              color: r.officialStatus === 'RESOLVED' ? '#6ee7b7' : r.officialStatus === 'ACTION_RECORDED' ? '#7dd3fc' : '#fde68a',
                            }}>
                              {(r.officialStatus || 'AWAITING_REVIEW').replace('_', ' ')}
                            </span>
                          </td>
                          <td style={{ padding: '12px', fontSize: '12px', color: r.assignedTeam ? '#38bdf8' : '#64748b' }}>
                            {r.assignedTeam || 'None assigned'}
                          </td>
                          <td style={{ padding: '12px', textAlign: 'right' }}>
                            <button
                              onClick={() => handleOpenReview(r)}
                              style={{
                                background: '#0284c7',
                                color: '#fff',
                                border: 'none',
                                padding: '6px 12px',
                                borderRadius: '4px',
                                fontSize: '12px',
                                fontWeight: 600,
                                cursor: 'pointer',
                              }}
                            >
                              Review & Order
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: INCIDENT INTELLIGENCE & CLUSTERS */}
        {activeTab === 'incidents' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ background: '#0d1d36', border: '1px solid #1e293b', borderRadius: '8px', padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 700, color: '#f8fafc' }}>
                    Incident Intelligence & Duplicate Report Clustering
                  </h3>
                  <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#94a3b8' }}>
                    AI groups correlated field reports into consolidated incidents based on text similarity, location overlap, and time window.
                  </p>
                </div>
                <div style={{ background: 'rgba(56, 189, 248, 0.1)', border: '1px solid #0284c7', padding: '6px 14px', borderRadius: '6px', fontSize: '11px', color: '#38bdf8', fontWeight: 600 }}>
                  Automated Correlation Engine Active
                </div>
              </div>

              {incidents.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 20px', color: '#64748b', fontSize: '13px' }}>
                  <Radio size={32} style={{ color: '#0284c7', margin: '0 auto 10px', display: 'block', opacity: 0.6 }} />
                  No multi-report incident clusters detected yet. When citizens submit related reports in the same area, ML models will link them here automatically.
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '16px', marginTop: '16px' }}>
                  {incidents.map((inc) => (
                    <div
                      key={inc.incidentCode}
                      style={{
                        background: '#071427',
                        border: '1px solid #1e293b',
                        borderRadius: '8px',
                        padding: '18px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '12px',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <span style={{ fontSize: '11px', fontWeight: 800, color: '#38bdf8', letterSpacing: '0.5px' }}>
                            {inc.incidentCode}
                          </span>
                          <h4 style={{ margin: '3px 0 0', fontSize: '15px', fontWeight: 700, color: '#f8fafc' }}>
                            {inc.title}
                          </h4>
                        </div>
                        <span style={{
                          background: inc.status === 'RESOLVED' ? '#064e3b' : '#7f1d1d',
                          color: inc.status === 'RESOLVED' ? '#6ee7b7' : '#fca5a5',
                          fontSize: '10px',
                          fontWeight: 700,
                          padding: '3px 8px',
                          borderRadius: '4px',
                          textTransform: 'uppercase'
                        }}>
                          {inc.status.replace('_', ' ')}
                        </span>
                      </div>

                      <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                        <MapPin size={12} style={{ display: 'inline', verticalAlign: '-1px', marginRight: '3px' }} />
                        <b>{inc.location}</b> · Sector Severity: <b style={{ color: '#ef4444' }}>{inc.severityScore}/100</b>
                      </div>

                      <p style={{ margin: 0, fontSize: '12px', color: '#cbd5e1', lineHeight: '1.5', background: '#091830', padding: '10px 12px', borderRadius: '6px', borderLeft: '3px solid #0284c7' }}>
                        {inc.aiSummary}
                      </p>

                      {/* Linked citizen reports */}
                      <div style={{ borderTop: '1px solid #1e293b', paddingTop: '10px' }}>
                        <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', marginBottom: '6px' }}>
                          LINKED FIELD REPORTS ({inc.linkedReports?.length || 0}):
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          {inc.linkedReports?.map((link, idx) => (
                            <div
                              key={idx}
                              style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                background: '#0a1a33',
                                padding: '6px 10px',
                                borderRadius: '4px',
                                fontSize: '11px',
                              }}
                            >
                              <span style={{ fontWeight: 600, color: '#38bdf8' }}>{link.reportId}</span>
                              <span style={{ color: '#94a3b8', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {link.title}
                              </span>
                              <span style={{ color: '#10b981', fontWeight: 600 }}>
                                {Math.round(link.similarityScore * 100)}% match
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: '8px' }}>
                        <div style={{ fontSize: '11px', color: '#38bdf8' }}>
                          <Shield size={12} style={{ display: 'inline', verticalAlign: '-1px', marginRight: '3px' }} />
                          <b>Assigned:</b> {inc.assignedTeam || 'Pending Deployment'}
                        </div>
                        <button
                          onClick={() => handleOpenReview(inc)}
                          style={{
                            background: '#0284c7',
                            color: '#fff',
                            border: 'none',
                            padding: '6px 12px',
                            borderRadius: '4px',
                            fontSize: '11px',
                            fontWeight: 700,
                            cursor: 'pointer',
                          }}
                        >
                          Manage Incident
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 4: FULL TACTICAL MAP ROOM */}
        {activeTab === 'map' && (
          <div style={{ background: '#0d1d36', border: '1px solid #1e293b', borderRadius: '8px', padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 700, color: '#f8fafc' }}>
                  Full Tactical Operations Map Room
                </h3>
                <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#94a3b8' }}>
                  Live OpenStreetMap GIS Engine showing all reported disaster sites, geocoded pins, and rescue zones.
                </p>
              </div>
            </div>

            <LeafletMap
              markers={markers}
              onSelectIncident={(m) => {
                const rep = reports.find((r) => r.id === m.id);
                if (rep) handleOpenReview(rep);
                else handleOpenReview(m);
              }}
              height="650px"
            />
          </div>
        )}
      </div>

      {/* OFFICIAL REVIEW & DISPATCH MODAL / DRAWER */}
      {selectedItem && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(3, 10, 24, 0.85)',
          backdropFilter: 'blur(8px)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
        }}>
          <div style={{
            background: '#091a33',
            border: '1px solid #1e293b',
            borderRadius: '12px',
            width: '100%',
            maxWidth: '1050px',
            maxHeight: '92vh',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '16px 24px',
              borderBottom: '1px solid #1e293b',
              background: '#071529',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{
                  background: '#0284c7',
                  color: '#fff',
                  fontSize: '11px',
                  fontWeight: 800,
                  padding: '3px 8px',
                  borderRadius: '4px'
                }}>
                  {selectedItem.publicId || selectedItem.id || selectedItem.incidentCode}
                </span>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#f8fafc' }}>
                  Official Incident Review & Action Order Console
                </h3>
              </div>
              <button
                onClick={() => setSelectedItem(null)}
                style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '24px', overflowY: 'auto', display: 'grid', gridTemplateColumns: '1fr 1fr 1.15fr', gap: '20px' }}>
              {/* Column 1: Citizen Original Report */}
              <div style={{ background: '#071427', border: '1px solid #1e293b', borderRadius: '8px', padding: '16px' }}>
                <div style={{ fontSize: '11px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: '8px' }}>
                  1. ORIGINAL FIELD SUBMISSION
                </div>
                <h4 style={{ margin: '0 0 8px', fontSize: '15px', fontWeight: 700, color: '#f1f5f9' }}>
                  {selectedItem.title}
                </h4>
                <div style={{ fontSize: '12px', color: '#38bdf8', marginBottom: '10px' }}>
                  <MapPin size={12} style={{ display: 'inline', verticalAlign: '-1px', marginRight: '3px' }} />
                  {selectedItem.location || selectedItem.locationText} {selectedItem.landmark ? `· Landmark: ${selectedItem.landmark}` : ''}
                </div>

                <div style={{ background: '#091a33', padding: '10px', borderRadius: '6px', fontSize: '12px', color: '#cbd5e1', lineHeight: '1.5', marginBottom: '12px' }}>
                  "{selectedItem.description || selectedItem.aiSummary}"
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '11px', color: '#94a3b8' }}>
                  <div>Reported Category: <b style={{ color: '#fff' }}>{selectedItem.reportedCategory || selectedItem.category}</b></div>
                  <div>Incident Time: <b style={{ color: '#fff' }}>{selectedItem.incidentAt ? new Date(selectedItem.incidentAt).toLocaleTimeString() : 'Recent'}</b></div>
                  <div>Trapped: <b style={{ color: '#ef4444' }}>{selectedItem.trappedPeople || selectedItem.trappedPeopleTotal || 0}</b></div>
                  <div>Injured: <b style={{ color: '#f97316' }}>{selectedItem.injuredPeople || selectedItem.injuredPeopleTotal || 0}</b></div>
                  <div>Affected: <b style={{ color: '#38bdf8' }}>{selectedItem.affectedPeople || selectedItem.affectedPeopleTotal || 0}</b></div>
                  <div>Media Evidence: <b style={{ color: '#fff' }}>{selectedItem.hasImage ? 'Yes (Photo)' : 'None'}</b></div>
                </div>

                {selectedItem.reporter && (
                  <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px solid #1e293b', fontSize: '11px', color: '#64748b' }}>
                    Reporter: <b style={{ color: '#cbd5e1' }}>{selectedItem.reporter.name}</b> ({selectedItem.reporter.email})
                  </div>
                )}
              </div>

              {/* Column 2: AI Preprocessed NLP Intelligence */}
              <div style={{ background: '#071427', border: '1px solid #1e293b', borderRadius: '8px', padding: '16px' }}>
                <div style={{ fontSize: '11px', fontWeight: 800, color: '#38bdf8', textTransform: 'uppercase', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Activity size={13} /> 2. AI & NLP STRUCTURED ANALYSIS
                </div>

                {selectedItem.analysis ? (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                      <span style={{ fontSize: '12px', color: '#94a3b8' }}>Predicted Disaster:</span>
                      <span style={{ background: '#0284c7', color: '#fff', fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '4px', textTransform: 'capitalize' }}>
                        {selectedItem.analysis.category?.replace('_', ' ')} ({Math.round((selectedItem.analysis.confidence || 0.85) * 100)}%)
                      </span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                      <span style={{ fontSize: '12px', color: '#94a3b8' }}>Severity Triage Score:</span>
                      <span style={{ color: '#ef4444', fontWeight: 800, fontSize: '14px' }}>
                        {selectedItem.analysis.severityScore}/100 ({selectedItem.analysis.priority?.toUpperCase()})
                      </span>
                    </div>

                    <div style={{ background: '#091a33', padding: '10px', borderRadius: '6px', fontSize: '11px', color: '#e2e8f0', lineHeight: '1.45', marginBottom: '12px' }}>
                      <b>Grounded AI Summary:</b><br />
                      {selectedItem.analysis.summary}
                    </div>

                    <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                      <b>Explainability Audit Signals:</b>
                      <ul style={{ margin: '4px 0 0', paddingLeft: '16px', color: '#cbd5e1' }}>
                        {(selectedItem.analysis.support?.evidence || [
                          'Urgency terms detected in description',
                          'Location mapped to hazard coordinates'
                        ]).slice(0, 3).map((ev, i) => (
                          <li key={i}>{ev}</li>
                        ))}
                      </ul>
                    </div>

                    <div style={{ marginTop: '12px', background: 'rgba(2, 132, 199, 0.1)', border: '1px solid rgba(2, 132, 199, 0.3)', padding: '8px 10px', borderRadius: '4px', fontSize: '11px', color: '#38bdf8' }}>
                      <MapPin size={12} style={{ display: 'inline', verticalAlign: '-1px', marginRight: '3px' }} /> Geocoded: Lat {selectedItem.latitude}, Lng {selectedItem.longitude}
                    </div>
                  </>
                ) : (
                  <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                    Incident summary: {selectedItem.aiSummary || 'Consolidated multi-report incident.'}
                  </div>
                )}
              </div>

              {/* Column 3: Official Decision & Action Console */}
              <form onSubmit={handleSaveReview} style={{ background: '#0a1d3b', border: '1px solid #0284c7', borderRadius: '8px', padding: '18px' }}>
                <div style={{ fontSize: '11px', fontWeight: 800, color: '#38bdf8', textTransform: 'uppercase', marginBottom: '12px' }}>
                  3. OFFICIAL OPERATIONAL ORDERS
                </div>

                {reviewSuccess && (
                  <div style={{ background: '#064e3b', color: '#6ee7b7', padding: '8px 12px', borderRadius: '6px', fontSize: '12px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <CheckCircle2 size={16} /> {reviewSuccess}
                  </div>
                )}

                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#94a3b8', marginBottom: '4px' }}>
                    REVIEW DECISION STATUS
                  </label>
                  <select
                    value={reviewForm.status}
                    onChange={(e) => setReviewForm({ ...reviewForm, status: e.target.value })}
                    style={{ width: '100%', background: '#071427', border: '1px solid #1e293b', color: '#fff', padding: '8px', borderRadius: '4px', fontSize: '12px' }}
                  >
                    <option value="AWAITING_REVIEW">Awaiting Review</option>
                    <option value="UNDER_REVIEW">Under Active Field Review</option>
                    <option value="ACTION_RECORDED">Action Dispatched / Response Recorded</option>
                    <option value="RESOLVED">Resolved / Declared Safe</option>
                    <option value="FALSE_ALARM">False Alarm</option>
                  </select>
                </div>

                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#94a3b8', marginBottom: '4px' }}>
                    ASSIGN RESPONSE BATTALION / UNIT
                  </label>
                  <select
                    value={reviewForm.assignedTeam}
                    onChange={(e) => setReviewForm({ ...reviewForm, assignedTeam: e.target.value })}
                    style={{ width: '100%', background: '#071427', border: '1px solid #1e293b', color: '#fff', padding: '8px', borderRadius: '4px', fontSize: '12px' }}
                  >
                    {TEAMS_LIST.map((team) => (
                      <option key={team} value={team}>{team}</option>
                    ))}
                  </select>
                </div>

                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#94a3b8', marginBottom: '4px' }}>
                    OFFICIAL DIRECTIVES / REMARKS
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Enter operational directives, deployed resources, and relief instructions..."
                    value={reviewForm.officialRemarks}
                    onChange={(e) => setReviewForm({ ...reviewForm, officialRemarks: e.target.value })}
                    style={{ width: '100%', background: '#071427', border: '1px solid #1e293b', color: '#fff', padding: '8px', borderRadius: '4px', fontSize: '12px', resize: 'vertical' }}
                  />
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#cbd5e1', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={reviewForm.verified}
                      onChange={(e) => setReviewForm({ ...reviewForm, verified: e.target.checked })}
                    />
                    Mark as Officially Verified Field Incident
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={reviewSubmitting}
                  style={{
                    width: '100%',
                    background: '#0284c7',
                    color: '#fff',
                    border: 'none',
                    padding: '10px 16px',
                    borderRadius: '6px',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                  }}
                >
                  <Send size={15} />
                  {reviewSubmitting ? 'Recording Action Orders...' : 'Submit Official Action & Update Citizen Tracker'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
