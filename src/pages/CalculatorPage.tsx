import React, { useState } from 'react';
import { AktuSubject } from '../types';

export const AKTU_SUBJECTS: Record<string, AktuSubject[]> = {
  sem1: [
    { name: 'Engineering Physics', credit: 4 },
    { name: 'Engineering Mathematics-I', credit: 4 },
    { name: 'Fundamentals of Electrical Engineering', credit: 3 },
    { name: 'Programming for Problem Solving (PPS)', credit: 3 },
    { name: 'Environment & Ecology', credit: 2 },
    { name: 'Engineering Physics Lab', credit: 1 },
    { name: 'Basic Electrical Engineering Lab', credit: 1 },
    { name: 'Programming for Problem Solving Lab', credit: 1 },
    { name: 'Engineering Graphics & Design Practice', credit: 2 },
  ],
  sem2: [
    { name: 'Engineering Chemistry', credit: 4 },
    { name: 'Engineering Mathematics-II', credit: 4 },
    { name: 'Fundamentals of Electronics Engineering', credit: 3 },
    { name: 'Fundamentals of Mechanical Engineering', credit: 3 },
    { name: 'Soft Skills', credit: 2 },
    { name: 'Engineering Chemistry Lab', credit: 1 },
    { name: 'Electronics Engineering Lab', credit: 1 },
    { name: 'English Language Lab', credit: 1 },
    { name: 'Workshop Practice', credit: 2 },
  ],
  sem3: [
    { name: 'Mathematics-III (PDE & Statistics)', credit: 4 },
    { name: 'Universal Human Values (UHV)', credit: 3 },
    { name: 'Data Structures', credit: 4 },
    { name: 'Computer Organization & Architecture (COA)', credit: 4 },
    { name: 'Discrete Structures & Theory of Logic (DSTL)', credit: 3 },
    { name: 'Data Structures Lab', credit: 1 },
    { name: 'Computer Organization Lab', credit: 1 },
    { name: 'Web Designing Workshop', credit: 1 },
    { name: 'Mini Project / Internship Assessment', credit: 2 },
  ],
  sem4: [
    { name: 'Maths-IV / Science Based Open Elective', credit: 4 },
    { name: 'Technical Communication', credit: 3 },
    { name: 'Operating Systems', credit: 4 },
    { name: 'Theory of Automata & Formal Languages (TAFL)', credit: 4 },
    { name: 'Object Oriented Programming (OOP)', credit: 3 },
    { name: 'Operating Systems Lab', credit: 1 },
    { name: 'Object Oriented Programming Lab', credit: 1 },
    { name: 'Cyber Security Workshop', credit: 1 },
    { name: 'Python Programming Lab', credit: 2 },
  ],
  sem5: [
    { name: 'Database Management Systems (DBMS)', credit: 4 },
    { name: 'Design & Analysis of Algorithms (DAA)', credit: 4 },
    { name: 'Web Technology', credit: 4 },
    { name: 'Departmental Elective-I', credit: 3 },
    { name: 'Departmental Elective-II', credit: 3 },
    { name: 'DBMS Lab', credit: 1 },
    { name: 'DAA Lab', credit: 1 },
    { name: 'Web Technology Lab', credit: 1 },
    { name: 'Mini Project / Internship Assessment', credit: 2 },
  ],
  sem6: [
    { name: 'Software Engineering', credit: 4 },
    { name: 'Compiler Design', credit: 4 },
    { name: 'Computer Networks', credit: 4 },
    { name: 'Departmental Elective-III', credit: 3 },
    { name: 'Open Elective-I', credit: 3 },
    { name: 'Software Engineering Lab', credit: 1 },
    { name: 'Compiler Design Lab', credit: 1 },
    { name: 'Computer Networks Lab', credit: 1 },
  ],
  sem7: [
    { name: 'Artificial Intelligence & Machine Learning', credit: 3 },
    { name: 'Departmental Elective-IV', credit: 3 },
    { name: 'Departmental Elective-V', credit: 3 },
    { name: 'Open Elective-II', credit: 3 },
    { name: 'Artificial Intelligence Lab', credit: 1 },
    { name: 'Industrial Training / Internship Assessment', credit: 2 },
    { name: 'Project-I', credit: 4 },
  ],
  sem8: [
    { name: 'Open Elective-III', credit: 3 },
    { name: 'Open Elective-IV', credit: 3 },
    { name: 'Project-II / Capstone Project', credit: 9 },
    { name: 'Comprehensive Viva / Seminar', credit: 1 },
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
  const [activeTab, setActiveTab] = useState<'calc-sgpa' | 'calc-ygpa' | 'calc-cgpa'>('calc-sgpa');

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

  const handleCreditChange = (idx: number, delta: number) => {
    setSubjects((prev) => {
      const copy = [...prev];
      const currentCredit = copy[idx].credit || 1;
      const newCredit = Math.max(1, Math.min(20, currentCredit + delta));
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
      {/* Internal Hero - Matching calculator.html */}
      <div className="internal-hero">
        <h1>AKTU B Tech CGPA Calculator</h1>
        <p>
          Calculate your SGPA, YGPA, and CGPA easily. Enter your credits and marks/grades to get
          accurate results based on the AKTU grading system.
        </p>
      </div>

      <section className="content-section" id="calculator">
        {/* Tabs - Matching calculator.html */}
        <div className="tabs-container">
          <button
            className={`tab-btn ${activeTab === 'calc-sgpa' ? 'active' : ''}`}
            data-tab="calc-sgpa"
            onClick={() => setActiveTab('calc-sgpa')}
          >
            SGPA Calculator
          </button>
          <button
            className={`tab-btn ${activeTab === 'calc-ygpa' ? 'active' : ''}`}
            data-tab="calc-ygpa"
            onClick={() => setActiveTab('calc-ygpa')}
          >
            YGPA Calculator
          </button>
          <button
            className={`tab-btn ${activeTab === 'calc-cgpa' ? 'active' : ''}`}
            data-tab="calc-cgpa"
            onClick={() => setActiveTab('calc-cgpa')}
          >
            CGPA Calculator
          </button>
        </div>

        {/* SGPA Calculator Tab - Matching calculator.html */}
        {activeTab === 'calc-sgpa' && (
          <div className="tab-content active" id="calc-sgpa">
            <div className="calc-box">
              <div className="calc-row" style={{ gridTemplateColumns: '1fr' }}>
                <select
                  className="calc-input"
                  id="semester-select"
                  value={selectedSem}
                  onChange={(e) => handleSemesterSelect(e.target.value)}
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

              <div id="sgpa-rows" style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '16px' }}>
                {subjects.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '30px 10px', color: 'var(--text-light)' }}>
                    <i className="fas fa-graduation-cap" style={{ fontSize: '1.8rem', marginBottom: '8px', display: 'block', opacity: 0.6 }}></i>
                    Please select a semester above to view the AKTU syllabus subjects and calculate SGPA.
                  </div>
                ) : (
                  subjects.map((sub, idx) => {
                    const val = grades[idx] || '';
                    const gradeInfo = convertMarksToGrade(val);

                    return (
                      <div key={idx} className="calc-subject-row">
                        <div style={{ flex: 1, minWidth: 0, paddingRight: '8px' }}>
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
                            <button
                              type="button"
                              onClick={() => handleRemoveSubject(idx)}
                              title="Remove subject"
                              style={{
                                background: 'transparent',
                                border: 'none',
                                color: 'var(--text-light)',
                                cursor: 'pointer',
                                padding: '4px',
                                fontSize: '0.85rem',
                              }}
                              aria-label={`Remove ${sub.name}`}
                            >
                              <i className="fas fa-times"></i>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {subjects.length > 0 && (
                <div style={{ marginTop: '12px', textAlign: 'right' }}>
                  <button
                    type="button"
                    onClick={handleAddSubject}
                    className="btn btn-outline"
                    style={{ fontSize: '0.82rem', padding: '6px 12px' }}
                  >
                    <i className="fas fa-plus" style={{ marginRight: '6px' }}></i> Add Subject
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

        {/* YGPA Calculator Tab - Matching calculator.html */}
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

        {/* CGPA Calculator Tab - Matching calculator.html */}
        {activeTab === 'calc-cgpa' && (
          <div className="tab-content active" id="calc-cgpa">
            <div className="calc-box">
              <p style={{ textAlign: 'center', marginBottom: '20px', color: 'var(--text-light)' }}>
                Enter SGPAs for completed semesters
              </p>
              
              {/* Row 1: Sem 1 & Sem 2 */}
              <div className="calc-row" style={{ gridTemplateColumns: '1fr 1fr' }}>
                <input
                  type="number"
                  className="calc-input cgpa-input"
                  placeholder="Sem 1 SGPA"
                  step="0.01"
                  min="0"
                  max="10"
                  value={cgpaList[0]}
                  onChange={(e) => handleCgpaInputChange(0, e.target.value)}
                />
                <input
                  type="number"
                  className="calc-input cgpa-input"
                  placeholder="Sem 2 SGPA"
                  step="0.01"
                  min="0"
                  max="10"
                  value={cgpaList[1]}
                  onChange={(e) => handleCgpaInputChange(1, e.target.value)}
                />
              </div>

              {/* Row 2: Sem 3 & Sem 4 */}
              <div className="calc-row" style={{ gridTemplateColumns: '1fr 1fr' }}>
                <input
                  type="number"
                  className="calc-input cgpa-input"
                  placeholder="Sem 3 SGPA"
                  step="0.01"
                  min="0"
                  max="10"
                  value={cgpaList[2]}
                  onChange={(e) => handleCgpaInputChange(2, e.target.value)}
                />
                <input
                  type="number"
                  className="calc-input cgpa-input"
                  placeholder="Sem 4 SGPA"
                  step="0.01"
                  min="0"
                  max="10"
                  value={cgpaList[3]}
                  onChange={(e) => handleCgpaInputChange(3, e.target.value)}
                />
              </div>

              {/* Row 3: Sem 5 & Sem 6 */}
              <div className="calc-row" style={{ gridTemplateColumns: '1fr 1fr' }}>
                <input
                  type="number"
                  className="calc-input cgpa-input"
                  placeholder="Sem 5 SGPA"
                  step="0.01"
                  min="0"
                  max="10"
                  value={cgpaList[4]}
                  onChange={(e) => handleCgpaInputChange(4, e.target.value)}
                />
                <input
                  type="number"
                  className="calc-input cgpa-input"
                  placeholder="Sem 6 SGPA"
                  step="0.01"
                  min="0"
                  max="10"
                  value={cgpaList[5]}
                  onChange={(e) => handleCgpaInputChange(5, e.target.value)}
                />
              </div>

              {/* Row 4: Sem 7 & Sem 8 */}
              <div className="calc-row" style={{ gridTemplateColumns: '1fr 1fr' }}>
                <input
                  type="number"
                  className="calc-input cgpa-input"
                  placeholder="Sem 7 SGPA"
                  step="0.01"
                  min="0"
                  max="10"
                  value={cgpaList[6]}
                  onChange={(e) => handleCgpaInputChange(6, e.target.value)}
                />
                <input
                  type="number"
                  className="calc-input cgpa-input"
                  placeholder="Sem 8 SGPA"
                  step="0.01"
                  min="0"
                  max="10"
                  value={cgpaList[7]}
                  onChange={(e) => handleCgpaInputChange(7, e.target.value)}
                />
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
