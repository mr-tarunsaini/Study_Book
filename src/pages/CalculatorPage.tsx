import React, { useState } from 'react';
import { AktuSubject } from '../types';

const AKTU_SUBJECTS: Record<string, AktuSubject[]> = {
  sem1: [
    { name: 'Engg Physics', credit: 4 },
    { name: 'Engg Math-I', credit: 4 },
    { name: 'Basic Electrical', credit: 3 },
    { name: 'PPS', credit: 3 },
    { name: 'Ecology', credit: 3 },
    { name: 'Physics Lab', credit: 1 },
    { name: 'Electrical Lab', credit: 1 },
    { name: 'Programming Lab', credit: 1 },
    { name: 'Graphics Lab', credit: 2 },
  ],
  sem2: [
    { name: 'Engg Chemistry', credit: 4 },
    { name: 'Engg Math-II', credit: 4 },
    { name: 'Basic Electronics', credit: 3 },
    { name: 'Mechanical', credit: 3 },
    { name: 'Soft Skills', credit: 3 },
    { name: 'Chemistry Lab', credit: 1 },
    { name: 'Electronics Lab', credit: 1 },
    { name: 'English Lab', credit: 1 },
    { name: 'Workshop', credit: 2 },
  ],
  sem3: [
    { name: 'Engg Maths-III', credit: 4 },
    { name: 'Universal Human Value', credit: 3 },
    { name: 'Data Structures', credit: 4 },
    { name: 'Computer Org & Arch', credit: 4 },
    { name: 'Discrete Structures', credit: 3 },
    { name: 'Data Structures Lab', credit: 1 },
    { name: 'COA Lab', credit: 1 },
    { name: 'Web Designing Workshop', credit: 1 },
    { name: 'Cyber Security', credit: 2 },
    { name: 'Mini Project / Internship', credit: 2 },
  ],
  sem4: [
    { name: 'Maths-IV', credit: 4 },
    { name: 'Technical Communication', credit: 3 },
    { name: 'Operating Systems', credit: 4 },
    { name: 'Automata Theory', credit: 4 },
    { name: 'Object Orient Programming', credit: 3 },
    { name: 'Operating Systems Lab', credit: 1 },
    { name: 'Object Oriented Programming Lab', credit: 1 },
    { name: 'Cyber Security Workshop', credit: 1 },
    { name: 'Python Programming', credit: 2 },
  ],
  sem5: [
    { name: 'DBMS', credit: 4 },
    { name: 'Web Technology', credit: 4 },
    { name: 'Design & Analysis of Algo', credit: 4 },
    { name: 'Dept. Elective-I', credit: 3 },
    { name: 'Dept. Elective-II', credit: 3 },
    { name: 'DBMS Lab', credit: 1 },
    { name: 'Web Technology Lab', credit: 1 },
    { name: 'Design & Analysis of Algo Lab', credit: 1 },
    { name: 'Mini Project', credit: 2 },
  ],
  sem6: [
    { name: 'Software Engineering', credit: 4 },
    { name: 'Compiler Design', credit: 4 },
    { name: 'Computer Networks', credit: 4 },
    { name: 'Dept. Elective-III', credit: 3 },
    { name: 'Open Elective-I', credit: 3 },
    { name: 'Software Engineering Lab', credit: 1 },
    { name: 'Compiler Design Lab', credit: 1 },
    { name: 'Computer Networks Lab', credit: 1 },
  ],
  sem7: [
    { name: 'Artificial Intelligence', credit: 3 },
    { name: 'Dept. Elective-IV', credit: 3 },
    { name: 'Open Elective-II', credit: 3 },
    { name: 'Artificial Intelligence Lab', credit: 1 },
    { name: 'Mini Project', credit: 2 },
    { name: 'Project-I', credit: 5 },
    { name: 'Startup and Entrepreneurial Activity', credit: 2 },
  ],
  sem8: [
    { name: 'Open Elective-III', credit: 3 },
    { name: 'Open Elective-IV', credit: 3 },
    { name: 'Project-II', credit: 10 },
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

export const CalculatorPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'sgpa' | 'ygpa' | 'cgpa'>('sgpa');

  // SGPA state
  const [selectedSem, setSelectedSem] = useState<string>('sem1');
  const [subjects, setSubjects] = useState<AktuSubject[]>(() =>
    (AKTU_SUBJECTS['sem1'] || []).map((s) => ({ ...s }))
  );
  const [grades, setGrades] = useState<Record<string, string>>({});
  const [sgpaResult, setSgpaResult] = useState<string>('0.00');

  // YGPA state
  const [oddSgpa, setOddSgpa] = useState<string>('');
  const [evenSgpa, setEvenSgpa] = useState<string>('');
  const [ygpaResult, setYgpaResult] = useState<string>('0.00');

  // CGPA state
  const [cgpaList, setCgpaList] = useState<string[]>(Array(8).fill(''));
  const [cgpaResult, setCgpaResult] = useState<string>('0.00');

  const handleSemesterSelect = (newSem: string) => {
    setSelectedSem(newSem);
    setSubjects((AKTU_SUBJECTS[newSem] || []).map((s) => ({ ...s })));
    setGrades({});
    setSgpaResult('0.00');
  };

  const handleCreditChange = (idx: number, delta: number) => {
    setSubjects((prev) => {
      const copy = [...prev];
      const newCredit = Math.max(1, Math.min(20, (copy[idx].credit || 1) + delta));
      copy[idx] = { ...copy[idx], credit: newCredit };
      return copy;
    });
  };

  const handleDirectCreditSet = (idx: number, rawVal: string) => {
    const num = parseInt(rawVal, 10);
    const clamped = Math.max(1, Math.min(20, isNaN(num) ? 1 : num));
    setSubjects((prev) => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], credit: clamped };
      return copy;
    });
  };

  const handleGradeChange = (index: number, rawVal: string) => {
    let val = rawVal.trim();
    const num = parseFloat(val);
    if (!isNaN(num)) {
      if (num > 100) val = '100';
      else if (num < 0) val = '0';
    } else {
      val = val.toUpperCase().slice(0, 2);
    }
    setGrades((prev) => ({ ...prev, [index]: val }));
  };

  const calculateSGPA = () => {
    let totalCreditPoints = 0;
    let totalCredits = 0;

    subjects.forEach((sub, idx) => {
      const val = grades[idx] || '';
      const { point } = convertMarksToGrade(val);
      const credit = sub.credit || 0;
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

  return (
    <div style={{ paddingTop: '20px', paddingBottom: '40px' }}>
      <div className="internal-hero">
        <h1>AKTU B Tech CGPA Calculator</h1>
        <p>
          Calculate your SGPA, YGPA, and CGPA easily. Enter your credits and marks/grades to get
          accurate results based on the AKTU grading system.
        </p>
      </div>

      {/* Tabs */}
      <div className="tabs-container">
        <button
          className={`tab-btn ${activeTab === 'sgpa' ? 'active' : ''}`}
          onClick={() => setActiveTab('sgpa')}
        >
          SGPA Calculator
        </button>
        <button
          className={`tab-btn ${activeTab === 'ygpa' ? 'active' : ''}`}
          onClick={() => setActiveTab('ygpa')}
        >
          YGPA Calculator
        </button>
        <button
          className={`tab-btn ${activeTab === 'cgpa' ? 'active' : ''}`}
          onClick={() => setActiveTab('cgpa')}
        >
          CGPA Calculator
        </button>
      </div>

      {/* SGPA Tab */}
      {activeTab === 'sgpa' && (
        <div className="calc-box">
          <div className="calc-row" style={{ gridTemplateColumns: '1fr' }}>
            <select
              className="calc-input"
              value={selectedSem}
              onChange={(e) => handleSemesterSelect(e.target.value)}
            >
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

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '16px' }}>
            {subjects.map((sub, idx) => {
              const val = grades[idx] || '';
              const gradeInfo = convertMarksToGrade(val);

              return (
                <div key={idx} className="calc-subject-row">
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: '0.94rem', color: 'var(--text-dark)' }}>
                      {sub.name}
                    </div>
                  </div>

                  <div className="calc-subject-controls">
                    {/* Interactive Credit Stepper */}
                    <div className="credit-stepper" title="Adjust subject credits">
                      <span className="credit-label">Credit:</span>
                      <button
                        type="button"
                        className="credit-stepper-btn"
                        onClick={() => handleCreditChange(idx, -1)}
                        title="Decrease credit"
                        disabled={sub.credit <= 1}
                        aria-label={`Decrease credit for ${sub.name}`}
                      >
                        <i className="fas fa-minus"></i>
                      </button>
                      <input
                        type="number"
                        className="credit-stepper-input"
                        value={sub.credit}
                        min="1"
                        max="20"
                        onChange={(e) => handleDirectCreditSet(idx, e.target.value)}
                        aria-label={`Credit for ${sub.name}`}
                      />
                      <button
                        type="button"
                        className="credit-stepper-btn"
                        onClick={() => handleCreditChange(idx, 1)}
                        title="Increase credit"
                        disabled={sub.credit >= 20}
                        aria-label={`Increase credit for ${sub.name}`}
                      >
                        <i className="fas fa-plus"></i>
                      </button>
                    </div>

                    {/* Marks or Grade Input with Grade Badge */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <input
                        type="text"
                        placeholder="Marks or Grade"
                        className="calc-input"
                        style={{ width: '135px', padding: '8px 10px', textAlign: 'center' }}
                        value={grades[idx] || ''}
                        onChange={(e) => handleGradeChange(idx, e.target.value)}
                        maxLength={5}
                      />
                      {gradeInfo.grade !== '-' && (
                        <span
                          className={`grade-badge grade-${gradeInfo.grade.toLowerCase()}`}
                          title={`Grade: ${gradeInfo.grade} (Point: ${gradeInfo.point})`}
                        >
                          {gradeInfo.grade}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="calc-actions">
            <button className="btn btn-purple" onClick={calculateSGPA}>
              Calculate SGPA
            </button>
          </div>

          <div className="calc-result-display">
            Your SGPA: <span>{sgpaResult}</span>
          </div>
        </div>
      )}

      {/* YGPA Tab */}
      {activeTab === 'ygpa' && (
        <div className="calc-box">
          <div className="calc-row" style={{ gridTemplateColumns: '1fr 1fr' }}>
            <div>
              <label className="calc-label">Odd Semester SGPA (0.00 - 10.00)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="10"
                placeholder="e.g. 7.50"
                className="calc-input"
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
              <label className="calc-label">Even Semester SGPA (0.00 - 10.00)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="10"
                placeholder="e.g. 8.00"
                className="calc-input"
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
            <button className="btn btn-purple" onClick={calculateYGPA}>
              Calculate YGPA
            </button>
          </div>

          <div className="calc-result-display">
            Your YGPA: <span>{ygpaResult}</span>
          </div>
        </div>
      )}

      {/* CGPA Tab */}
      {activeTab === 'cgpa' && (
        <div className="calc-box">
          <p style={{ textAlign: 'center', marginBottom: '20px', color: 'var(--text-light)' }}>
            Enter SGPAs for completed semesters (0.00 - 10.00):
          </p>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
              gap: '12px',
            }}
          >
            {cgpaList.map((val, idx) => (
              <div key={idx}>
                <label className="calc-label">Sem {idx + 1}</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="10"
                  placeholder="0.00"
                  className="calc-input"
                  value={val}
                  onChange={(e) => {
                    let v = e.target.value;
                    if (parseFloat(v) > 10) v = '10';
                    else if (parseFloat(v) < 0) v = '0';
                    const copy = [...cgpaList];
                    copy[idx] = v;
                    setCgpaList(copy);
                  }}
                />
              </div>
            ))}
          </div>

          <div className="calc-actions">
            <button className="btn btn-purple" onClick={calculateCGPA}>
              Calculate CGPA
            </button>
          </div>

          <div className="calc-result-display">
            Your CGPA: <span>{cgpaResult}</span>
          </div>
        </div>
      )}
    </div>
  );
};
