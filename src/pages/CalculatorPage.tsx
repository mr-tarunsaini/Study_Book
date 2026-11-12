import React, { useState } from 'react';
import { AktuSubject } from '../types';

export const AKTU_SUBJECTS: Record<string, AktuSubject[]> = {
  sem1: [
    { name: 'Engg Physics', credit: 4 },
    { name: 'Engg Math-I', credit: 4 },
    { name: 'Basic Electrical', credit: 3 },
    { name: 'PPS', credit: 3 },
    { name: 'Ecology', credit: 3 },
    { name: 'Physics Lab', credit: 1 },
    { name: 'Electrical Lab', credit: 1 },
    { name: 'PPS Lab', credit: 1 },
    { name: 'Engg Graphics', credit: 2 },
  ],
  sem2: [
    { name: 'Engg Chemistry', credit: 4 },
    { name: 'Engg Math-II', credit: 4 },
    { name: 'Basic Electronics', credit: 3 },
    { name: 'Basic Mechanical', credit: 3 },
    { name: 'Soft Skills', credit: 2 },
    { name: 'Chemistry Lab', credit: 1 },
    { name: 'Electronics Lab', credit: 1 },
    { name: 'English Lab', credit: 1 },
    { name: 'Workshop Practice', credit: 2 },
  ],
  sem3: [    
    { name: 'DE', credit: 4 },
    { name: 'DSTL', credit: 3 },
    { name: 'Technical Communication', credit: 3 },
    { name: 'Data Structures', credit: 4 },
    { name: 'COA', credit: 4 },    
    { name: 'Python', credit: 2 },
    { name: 'Data Structures Lab', credit: 1 },
    { name: 'COA Lab', credit: 1 },
    { name: 'Web Designing', credit: 1 },
    { name: 'Mini Project', credit: 2 },
  ],
  sem4: [
    { name: 'Maths-IV', credit: 4 },
    { name: 'Universal Human Values', credit: 3 },
    { name: 'Operating Systems', credit: 4 },
    { name: 'TAFL', credit: 4 },
    { name: 'OOPs', credit: 3 },
    { name: 'Operating Systems Lab', credit: 1 },
    { name: 'OOPs lab', credit: 1 },
    { name: 'Cyber Security Lab', credit: 1 },
    { name: 'Cyber Security', credit: 1 },
  ],
  sem5: [
    { name: 'DBMS', credit: 4 },
    { name: 'DAA', credit: 4 },
    { name: 'Web Technology', credit: 4 },
    { name: 'Dept Elective-I', credit: 3 },
    { name: 'Dept Elective-II', credit: 3 },
    { name: 'DBMS Lab', credit: 1 },
    { name: 'DAA Lab', credit: 1 },
    { name: 'Web Tech Lab', credit: 1 },
    { name: 'Mini Project', credit: 2 },
  ],
  sem6: [
    { name: 'Software Engineering', credit: 4 },
    { name: 'Compiler Design', credit: 4 },
    { name: 'Computer Networks', credit: 4 },
    { name: 'Dept Elective-III', credit: 3 },
    { name: 'Open Elective-I', credit: 3 },
    { name: 'Software Engg Lab', credit: 1 },
    { name: 'Compiler Lab', credit: 1 },
    { name: 'Networks Lab', credit: 1 },
  ],
  sem7: [
    { name: 'AI & Machine Learning', credit: 3 },
    { name: 'Dept Elective-IV', credit: 3 },
    { name: 'Dept Elective-V', credit: 3 },
    { name: 'Open Elective-II', credit: 3 },
    { name: 'AI Lab', credit: 1 },
    { name: 'Internship Assessment', credit: 2 },
    { name: 'Project-I', credit: 4 },
  ],
  sem8: [
    { name: 'Open Elective-III', credit: 3 },
    { name: 'Open Elective-IV', credit: 3 },
    { name: 'Project-II', credit: 9 },
    { name: 'Comprehensive Viva', credit: 1 },
  ],
};

export const convertMarksToGrade = (val: string): { grade: string; point: number } => {
  const trimmed = val.trim().toUpperCase();
  if (!trimmed) return { grade: '-', point: 0 };

  const num = parseFloat(trimmed);
  if (!isNaN(num)) {
    const marks = Math.min(100, Math.max(0, num));
    if (marks >= 90) return { grade: 'A', point: 10 };
    if (marks >= 80) return { grade: 'B', point: 9 };
    if (marks >= 70) return { grade: 'C', point: 8 };
    if (marks >= 60) return { grade: 'D', point: 7 };
    if (marks >= 40) return { grade: 'E', point: 5 };
    return { grade: 'F', point: 0 };
  }

  switch (trimmed) {
    case 'A':
    case 'O':
    case 'A+':
      return { grade: 'A', point: 10 };
    case 'B':
    case 'B+':
      return { grade: 'B', point: 9 };
    case 'C':
      return { grade: 'C', point: 8 };
    case 'D':
      return { grade: 'D', point: 7 };
    case 'E':
    case 'P':
      return { grade: 'E', point: 5 };
    case 'F':
    default:
      return { grade: 'F', point: 0 };
  }
};

interface CalcSubjectItem {
  name: string;
  credit: number | string;
}

export const CalculatorPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'calc-sgpa' | 'calc-ygpa' | 'calc-cgpa'>('calc-sgpa');

  // SGPA state
  const [selectedSem, setSelectedSem] = useState<string>('sem1');
  const [subjects, setSubjects] = useState<CalcSubjectItem[]>(() =>
    (AKTU_SUBJECTS['sem1'] || []).map((s) => ({ ...s }))
  );
  const [grades, setGrades] = useState<Record<string, string>>({});
  const [sgpaResult, setSgpaResult] = useState<string>('0.00');

  // YGPA state
  const [oddSgpa, setOddSgpa] = useState<string>('');
  const [evenSgpa, setEvenSgpa] = useState<string>('');
  const [ygpaResult, setYgpaResult] = useState<string>('0.00');

  // CGPA state (8 semesters)
  const [cgpaList, setCgpaList] = useState<string[]>(Array(8).fill(''));
  const [cgpaResult, setCgpaResult] = useState<string>('0.00');

  const handleSemesterSelect = (newSem: string) => {
    setSelectedSem(newSem);
    if (newSem && AKTU_SUBJECTS[newSem]) {
      setSubjects(AKTU_SUBJECTS[newSem].map((s) => ({ ...s })));
    } else {
      setSubjects([]);
    }
    setGrades({});
    setSgpaResult('0.00');
  };

  const handleCreditInput = (idx: number, raw: string) => {
    setSubjects((prev) => {
      const copy = [...prev];
      if (raw === '') {
        copy[idx] = { ...copy[idx], credit: '' };
      } else {
        const val = parseInt(raw, 10);
        copy[idx] = {
          ...copy[idx],
          credit: isNaN(val) ? '' : Math.min(20, Math.max(0, val)),
        };
      }
      return copy;
    });
  };

  const handleCreditBlur = (idx: number) => {
    setSubjects((prev) => {
      const copy = [...prev];
      const c = copy[idx]?.credit;
      if (c === '' || isNaN(Number(c)) || Number(c) < 1) {
        copy[idx] = { ...copy[idx], credit: 1 };
      }
      return copy;
    });
  };

  const handleGradeChange = (index: number, rawVal: string) => {
    if (rawVal === '') {
      setGrades((prev) => {
        const copy = { ...prev };
        delete copy[index];
        return copy;
      });
      return;
    }
    let val = rawVal.trim();
    const num = parseFloat(val);
    if (!isNaN(num)) {
      if (num > 100) val = '100';
    } else {
      val = val.toUpperCase().slice(0, 2);
    }
    setGrades((prev) => ({ ...prev, [index]: val }));
  };

  const handleAddSubject = () => {
    setSubjects((prev) => [
      ...prev,
      { name: `Elective / Subject ${prev.length + 1}`, credit: 3 },
    ]);
  };

  const handleRemoveSubject = (idx: number) => {
    setSubjects((prev) => prev.filter((_, i) => i !== idx));
    setGrades((prev) => {
      const next: Record<string, string> = {};
      Object.keys(prev).forEach((key) => {
        const k = parseInt(key, 10);
        if (k < idx) next[k] = prev[key];
        else if (k > idx) next[k - 1] = prev[key];
      });
      return next;
    });
  };

  const calculateSGPA = () => {
    let totalCreditPoints = 0;
    let totalCredits = 0;

    subjects.forEach((sub, idx) => {
      const val = grades[idx] || '';
      const { point } = convertMarksToGrade(val);
      const credit = Number(sub.credit) || 0;
      totalCreditPoints += point * credit;
      totalCredits += credit;
    });

    if (totalCredits > 0) {
      const res = Math.min(10, Math.max(0, totalCreditPoints / totalCredits));
      setSgpaResult(res.toFixed(2));
    } else {
      setSgpaResult('0.00');
    }
  };

  const calculateYGPA = () => {
    const o = Math.min(10, Math.max(0, parseFloat(oddSgpa)));
    const e = Math.min(10, Math.max(0, parseFloat(evenSgpa)));
    if (!isNaN(o) && !isNaN(e)) {
      const res = Math.min(10, Math.max(0, (o + e) / 2));
      setYgpaResult(res.toFixed(2));
    } else if (!isNaN(o)) {
      setYgpaResult(o.toFixed(2));
    } else if (!isNaN(e)) {
      setYgpaResult(e.toFixed(2));
    } else {
      setYgpaResult('0.00');
    }
  };

  const calculateCGPA = () => {
    const valid = cgpaList
      .map((val) => Math.min(10, Math.max(0, parseFloat(val))))
      .filter((n) => !isNaN(n) && n > 0);

    if (valid.length > 0) {
      const sum = valid.reduce((acc, curr) => acc + curr, 0);
      const res = Math.min(10, Math.max(0, sum / valid.length));
      setCgpaResult(res.toFixed(2));
    } else {
      setCgpaResult('0.00');
    }
  };

  const handleCgpaInputChange = (idx: number, rawVal: string) => {
    let v = rawVal;
    const num = parseFloat(v);
    if (!isNaN(num)) {
      if (num > 10) v = '10';
      else if (num < 0) v = '0';
    }
    const copy = [...cgpaList];
    copy[idx] = v;
    setCgpaList(copy);
  };

  return (
    <div style={{ paddingTop: '20px', paddingBottom: '40px' }}>
      {/* Internal Hero */}
      <div className="internal-hero">
        <h1>AKTU B Tech CGPA Calculator</h1>
        <p>
          Calculate your SGPA, YGPA, and CGPA easily. Enter your credits and marks/grades to get
          accurate results based on the AKTU grading system.
        </p>
      </div>

      <section className="content-section" id="calculator">
        {/* Responsive Pill Tabs */}
        <div className="calc-pill-tabs">
          <button
            type="button"
            className={`calc-pill-tab ${activeTab === 'calc-sgpa' ? 'active' : ''}`}
            onClick={() => setActiveTab('calc-sgpa')}
          >
            SGPA Calculator
          </button>
          <button
            type="button"
            className={`calc-pill-tab ${activeTab === 'calc-ygpa' ? 'active' : ''}`}
            onClick={() => setActiveTab('calc-ygpa')}
          >
            YGPA Calculator
          </button>
          <button
            type="button"
            className={`calc-pill-tab ${activeTab === 'calc-cgpa' ? 'active' : ''}`}
            onClick={() => setActiveTab('calc-cgpa')}
          >
            CGPA Calculator
          </button>
        </div>

        {/* SGPA Calculator Tab */}
        {activeTab === 'calc-sgpa' && (
          <div className="tab-content active" id="calc-sgpa">
            <div className="calc-box">
              <div style={{ marginBottom: '18px' }}>
                <select
                  className="calc-select"
                  id="semester-select"
                  value={selectedSem}
                  onChange={(e) => handleSemesterSelect(e.target.value)}
                  aria-label="Select Semester"
                >
                  <option value="">Select Semester</option>
                  <option value="sem1">Semester 1</option>
                  <option value="sem2">Semester 2</option>
                  <option value="sem3">Semester 3</option>
                  <option value="sem4">Semester 4</option>
                  <option value="sem5">Semester 5</option>
                  <option value="sem6">Semester 6</option>
                  <option value="sem7">Semester 7</option>
                  <option value="sem8">Semester 8</option>
                </select>
              </div>

              {subjects.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '30px 10px', color: 'var(--text-light)' }}>
                  <i className="fas fa-graduation-cap" style={{ fontSize: '1.8rem', marginBottom: '8px', display: 'block', opacity: 0.6 }}></i>
                  Please select a semester above to view the AKTU syllabus subjects and calculate SGPA.
                </div>
              ) : (
                <div className="calc-subject-list">
                  {subjects.map((sub, idx) => (
                    <div key={idx} className="calc-subject-item">
                      <span className="calc-subject-title">{sub.name}</span>
                      <div className="calc-inputs-group">
                        <input
                          type="number"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          className="calc-credit-input"
                          value={sub.credit}
                          min={1}
                          max={20}
                          onChange={(e) => handleCreditInput(idx, e.target.value)}
                          onBlur={() => handleCreditBlur(idx)}
                          aria-label={`Credits for ${sub.name}`}
                        />
                        <input
                          type="text"
                          className="calc-grade-input"
                          placeholder="Grade/Pt"
                          value={grades[idx] || ''}
                          onChange={(e) => handleGradeChange(idx, e.target.value)}
                          maxLength={5}
                          aria-label={`Grade for ${sub.name}`}
                        />
                        {subjects.length > (AKTU_SUBJECTS[selectedSem]?.length || 0) && idx >= (AKTU_SUBJECTS[selectedSem]?.length || 0) && (
                          <button
                            type="button"
                            onClick={() => handleRemoveSubject(idx)}
                            title="Remove added subject"
                            aria-label={`Remove ${sub.name}`}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: 'var(--text-light)',
                              cursor: 'pointer',
                              padding: '2px',
                              fontSize: '0.85rem',
                            }}
                          >
                            <i className="fas fa-times"></i>
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {subjects.length > 0 && (
                <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    onClick={handleAddSubject}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#0080ff',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '4px 8px',
                      borderRadius: '6px',
                    }}
                  >
                    <i className="fas fa-plus"></i> Add Subject
                  </button>
                </div>
              )}

              <div className="calc-actions">
                <button className="btn btn-purple" id="calculate-sgpa-btn" onClick={calculateSGPA}>
                  Calculate SGPA
                </button>
              </div>

              <div className="calc-result-display" id="sgpa-result">
                Your SGPA: <span>{sgpaResult}</span>
              </div>
            </div>
          </div>
        )}

        {/* YGPA Calculator Tab */}
        {activeTab === 'calc-ygpa' && (
          <div className="tab-content active" id="calc-ygpa">
            <div className="calc-box">
              <div className="calc-row" style={{ gridTemplateColumns: '1fr 1fr' }}>
                <div>
                  <label className="calc-label">Odd Semester SGPA</label>
                  <input
                    type="number"
                    className="calc-input"
                    id="ygpa-odd"
                    placeholder="e.g. 7.5"
                    step="0.01"
                    min="0"
                    max="10"
                    value={oddSgpa}
                    onChange={(e) => {
                      let v = e.target.value;
                      if (parseFloat(v) > 10) v = '10';
                      else if (parseFloat(v) < 0) v = '0';
                      setOddSgpa(v);
                    }}
                  />
                </div>
                <div>
                  <label className="calc-label">Even Semester SGPA</label>
                  <input
                    type="number"
                    className="calc-input"
                    id="ygpa-even"
                    placeholder="e.g. 8.0"
                    step="0.01"
                    min="0"
                    max="10"
                    value={evenSgpa}
                    onChange={(e) => {
                      let v = e.target.value;
                      if (parseFloat(v) > 10) v = '10';
                      else if (parseFloat(v) < 0) v = '0';
                      setEvenSgpa(v);
                    }}
                  />
                </div>
              </div>

              <div className="calc-actions">
                <button className="btn btn-purple" id="calculate-ygpa-btn" onClick={calculateYGPA}>
                  Calculate YGPA
                </button>
              </div>

              <div className="calc-result-display" id="ygpa-result">
                Your YGPA: <span>{ygpaResult}</span>
              </div>
            </div>
          </div>
        )}

        {/* CGPA Calculator Tab */}
        {activeTab === 'calc-cgpa' && (
          <div className="tab-content active" id="calc-cgpa">
            <div className="calc-box">
              <p style={{ textAlign: 'center', marginBottom: '20px', color: 'var(--text-light)', fontWeight: 500 }}>
                Enter SGPAs for completed semesters
              </p>
              
              <div className="calc-cgpa-grid">
                {cgpaList.map((val, idx) => (
                  <input
                    key={idx}
                    type="number"
                    className="calc-input cgpa-input"
                    placeholder={`Sem ${idx + 1} SGPA`}
                    step="0.01"
                    min="0"
                    max="10"
                    value={val}
                    onChange={(e) => handleCgpaInputChange(idx, e.target.value)}
                  />
                ))}
              </div>

              <div className="calc-actions">
                <button className="btn btn-purple" id="calculate-cgpa-btn" onClick={calculateCGPA}>
                  Calculate CGPA
                </button>
              </div>

              <div className="calc-result-display" id="cgpa-result">
                Your CGPA: <span>{cgpaResult}</span>
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
};
