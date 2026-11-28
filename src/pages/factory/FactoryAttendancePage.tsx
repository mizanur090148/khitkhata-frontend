import React, { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { bnNum } from '@/utils/formatters';

interface WorkerAttendanceRow {
  name: string;
  role: string;
  shift: string;
  history: number[]; // 1: P, 0: A, 2: L
}

const INITIAL_PEOPLE: WorkerAttendanceRow[] = [
  { name: 'জসিম উদ্দিন', role: 'অপারেটর', shift: 'A', history: [1, 1, 1, 1, 1, 1, 1] },
  { name: 'সোহেল রানা', role: 'অপারেটর', shift: 'A', history: [1, 1, 0, 1, 1, 1, 1] },
  { name: 'মাসুদ মিয়া', role: 'অপারেটর', shift: 'B', history: [1, 1, 1, 1, 1, 2, 1] },
  { name: 'ফারুক হোসেন', role: 'অপারেটর', shift: 'B', history: [1, 1, 1, 1, 1, 1, 0] },
  { name: 'নাজমুল হক', role: 'টেকনিশিয়ান', shift: 'A', history: [1, 1, 1, 1, 1, 1, 1] },
  { name: 'রুবিনা খাতুন', role: 'QC ইন্সপেক্টর', shift: 'A', history: [1, 1, 1, 2, 1, 1, 1] },
  { name: 'আলমগীর কবির', role: 'অপারেটর', shift: 'A', history: [1, 1, 1, 1, 1, 1, 1] },
  { name: 'রিপন মাহমুদ', role: 'অপারেটর', shift: 'B', history: [1, 0, 1, 1, 1, 1, 1] },
  { name: 'শফিকুল ইসলাম', role: 'প্রোডাকশন ম্যানেজার', shift: 'সাধারণ', history: [1, 1, 1, 1, 1, 1, 1] },
  { name: 'রুবেল মিয়া', role: 'ফ্যাক্টরি QC', shift: 'A', history: [1, 1, 1, 1, 1, 1, 1] },
];

const DAYS = ['২৭', '২৮', '২৯', '৩০', '০১', '০২', '০৩'];

export const FactoryAttendancePage: React.FC = () => {
  const { punchAttendance, attendance, operators, t, language } = useApp();
  const [people, setPeople] = useState<WorkerAttendanceRow[]>(() => {
    if (attendance && attendance.length > 0) {
      return attendance.map((a) => {
        const todayVal = a.todayStatus === 'Present' ? 1 : a.todayStatus === 'Leave' || a.todayStatus === 'Late' ? 2 : 0;
        return {
          name: a.name,
          role: a.role,
          shift: a.shift || 'A',
          history: [1, 1, 1, 1, 1, 1, todayVal],
        };
      });
    }
    if (operators && operators.length > 0) {
      return operators.map((op) => ({
        name: op.name,
        role: op.designation || 'অপারেটর',
        shift: op.shift || 'A',
        history: [1, 1, 1, 1, 1, 1, 1],
      }));
    }
    return INITIAL_PEOPLE;
  });

  useEffect(() => {
    if (attendance && attendance.length > 0) {
      setPeople(
        attendance.map((a) => {
          const todayVal = a.todayStatus === 'Present' ? 1 : a.todayStatus === 'Leave' || a.todayStatus === 'Late' ? 2 : 0;
          return {
            name: a.name,
            role: a.role,
            shift: a.shift || 'A',
            history: [1, 1, 1, 1, 1, 1, todayVal],
          };
        })
      );
    } else if (operators && operators.length > 0) {
      setPeople(
        operators.map((op) => ({
          name: op.name,
          role: op.designation || 'অপারেটর',
          shift: op.shift || 'A',
          history: [1, 1, 1, 1, 1, 1, 1],
        }))
      );
    }
  }, [attendance, operators]);

  const [shiftFilter, setShiftFilter] = useState<string>('all');

  const toggleTodayStatus = async (workerName: string) => {
    setPeople((prev) =>
      prev.map((p) => {
        if (p.name !== workerName) return p;
        const lastIdx = p.history.length - 1;
        const cur = p.history[lastIdx];
        const next = cur === 1 ? 0 : cur === 0 ? 2 : 1;
        const newHist = [...p.history];
        newHist[lastIdx] = next;
        return { ...p, history: newHist };
      })
    );

    const target = people.find((p) => p.name === workerName);
    const lastIdx = (target?.history.length || 1) - 1;
    const cur = target?.history[lastIdx] || 1;
    const nextStatus = cur === 1 ? 'absent' : cur === 0 ? 'leave' : 'present';
    await punchAttendance(workerName, nextStatus as any, 0, target?.shift);
  };

  const filteredPeople = people.filter((p) =>
    shiftFilter === 'all' ? true : p.shift === shiftFilter
  );

  const presentCount = people.filter(
    (p) => p.history[p.history.length - 1] === 1
  ).length;
  const absentCount = people.filter(
    (p) => p.history[p.history.length - 1] === 0
  ).length;
  const leaveCount = people.filter(
    (p) => p.history[p.history.length - 1] === 2
  ).length;

  const renderBadge = (v: number) => {
    if (v === 1) return <span className="pill p-ok">P</span>;
    if (v === 0) return <span className="pill p-bad">A</span>;
    return <span className="pill p-warn">L</span>;
  };

  return (
    <div style={{ maxWidth: '100%', width: '100%' }}>
      {/* Header */}
      <div className="head">
        <div>
          <h2>{t('হাজিরা ও বেতন')}</h2>
          <p>{language === 'en' ? 'Shift-wise daily attendance, payroll generated automatically at month end' : 'শিফট অনুযায়ী দৈনিক হাজিরা, মাস শেষে বেতন শিট নিজে থেকেই তৈরি'}</p>
        </div>
      </div>

      {/* 4 KPI Cards */}
      <div className="kpis">
        <div className="kpi">
          <span>{language === 'en' ? 'Total Workers' : 'মোট কর্মী'}</span>
          <b>{bnNum(people.length)} {language === 'en' ? 'workers' : 'জন'}</b>
          <i>{language === 'en' ? 'Enrolled' : 'তালিকাভুক্ত'}</i>
        </div>
        <div className="kpi">
          <span>{t('উপস্থিত')}</span>
          <b style={{ color: 'var(--ok)' }}>{bnNum(presentCount)} {language === 'en' ? 'present' : 'জন'}</b>
          <i>{language === 'en' ? 'On floor' : 'ফ্লোরে কর্মরত'}</i>
        </div>
        <div className="kpi">
          <span>{t('ছুটি')}</span>
          <b style={{ color: 'var(--yarn)' }}>{bnNum(leaveCount)} {language === 'en' ? 'on leave' : 'জন'}</b>
          <i>{language === 'en' ? 'Approved leave' : 'অনুমোদিত ছুটি'}</i>
        </div>
        <div className="kpi">
          <span>{t('অনুপস্থিত')}</span>
          <b style={{ color: 'var(--bad)' }}>{bnNum(absentCount)} {language === 'en' ? 'absent' : 'জন'}</b>
          <i>{language === 'en' ? 'Absent today' : 'আজ অনুপস্থিত'}</i>
        </div>
      </div>

      {/* Shift Filter Chips */}
      <div className="row" style={{ gap: 8, marginBottom: 16 }}>
        <button
          type="button"
          className={`btn sm ${shiftFilter === 'all' ? 'pri' : ''}`}
          onClick={() => setShiftFilter('all')}
        >
          {t('সব শিফট')}
        </button>
        <button
          type="button"
          className={`btn sm ${shiftFilter === 'A' ? 'pri' : ''}`}
          onClick={() => setShiftFilter('A')}
        >
          {t('শিফট A')}
        </button>
        <button
          type="button"
          className={`btn sm ${shiftFilter === 'B' ? 'pri' : ''}`}
          onClick={() => setShiftFilter('B')}
        >
          {t('শিফট B')}
        </button>
      </div>

      {/* Attendance Matrix Table */}
      <div className="card">
        <div className="tw">
          <table>
            <thead>
              <tr>
                <th>{t('নাম')}</th>
                <th>{t('পদবী')}</th>
                <th>{t('শিফট')}</th>
                {DAYS.map((d, i) => (
                  <th key={i} style={{ textAlign: 'center' }}>
                    {bnNum(d)} Oct {i === DAYS.length - 1 && (language === 'en' ? '(Today)' : '(আজ)')}
                  </th>
                ))}
                <th style={{ textAlign: 'center' }}>{language === 'en' ? 'Change Attendance' : 'আজকের হাজিরা বদল'}</th>
              </tr>
            </thead>
            <tbody>
              {filteredPeople.map((p) => {
                const todayStatus = p.history[p.history.length - 1];
                return (
                  <tr key={p.name}>
                    <td style={{ fontWeight: 600 }}>{p.name}</td>
                    <td>{t(p.role)}</td>
                    <td>
                      <span className="pill p-acc">{p.shift}</span>
                    </td>
                    {p.history.map((h, i) => (
                      <td key={i} style={{ textAlign: 'center' }}>
                        {renderBadge(h)}
                      </td>
                    ))}
                    <td style={{ textAlign: 'center' }}>
                      <button
                        type="button"
                        className="btn sm"
                        onClick={() => toggleTodayStatus(p.name)}
                        title={language === 'en' ? 'Click to toggle status' : 'ক্লিক করে আজকের হাজিরা বদলান'}
                      >
                        {todayStatus === 1
                          ? (language === 'en' ? 'Mark Absent' : 'অনুপস্থিত করুন')
                          : todayStatus === 0
                          ? (language === 'en' ? 'Mark Leave' : 'ছুটি করুন')
                          : (language === 'en' ? 'Mark Present' : 'উপস্থিত করুন')}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="small muted" style={{ marginTop: 14 }}>
          {language === 'en' ? 'P = Present, A = Absent, L = Leave. Direct biometric machine sync supported.' : 'P = উপস্থিত (Present), A = অনুপস্থিত (Absent), L = ছুটি (Leave)। পরে ফিঙ্গারপ্রিন্ট মেশিনের ডেটা সরাসরি আনা যাবে।'}
        </p>
      </div>
    </div>
  );
};

