/**
 * Exam categories with per-exam subject mappings.
 * Focused on Indian competitive exams: SSC, Bank, Railway, IIT-JEE, NEET, UPSC.
 */

export type ExamEntry = {
  name: string;
  subjects: string[];
};

export type ExamCategory = {
  name: string;
  exams: ExamEntry[];
};

export const EXAM_CATEGORIES: ExamCategory[] = [
  {
    name: "SSC",
    exams: [
      {
        name: "SSC CGL",
        subjects: [
          "Quantitative Aptitude",
          "General Intelligence & Reasoning",
          "English Language & Comprehension",
          "General Awareness",
          "Statistics",
          "General Studies (Finance & Economics)",
        ],
      },
      {
        name: "SSC CHSL",
        subjects: [
          "Quantitative Aptitude",
          "General Intelligence & Reasoning",
          "English Language",
          "General Awareness",
        ],
      },
      {
        name: "SSC MTS",
        subjects: [
          "Numerical Aptitude",
          "Reasoning Ability",
          "English Language",
          "General Awareness",
        ],
      },
      {
        name: "SSC GD",
        subjects: [
          "General Intelligence & Reasoning",
          "General Knowledge & General Awareness",
          "Elementary Mathematics",
          "English / Hindi",
        ],
      },
      {
        name: "SSC CPO",
        subjects: [
          "Quantitative Aptitude",
          "General Intelligence & Reasoning",
          "English Language & Comprehension",
          "General Knowledge & General Awareness",
        ],
      },
      {
        name: "SSC Stenographer",
        subjects: [
          "General Intelligence & Reasoning",
          "General Awareness",
          "English Language & Comprehension",
        ],
      },
    ],
  },
  {
    name: "Bank",
    exams: [
      {
        name: "IBPS PO",
        subjects: [
          "Quantitative Aptitude",
          "Reasoning Ability",
          "English Language",
          "General / Economy / Banking Awareness",
          "Computer Aptitude",
          "Data Analysis & Interpretation",
        ],
      },
      {
        name: "IBPS Clerk",
        subjects: [
          "Quantitative Aptitude",
          "Reasoning Ability",
          "English Language",
          "General / Financial Awareness",
          "Computer Aptitude",
        ],
      },
      {
        name: "SBI PO",
        subjects: [
          "Quantitative Aptitude",
          "Reasoning & Computer Aptitude",
          "English Language",
          "Data Analysis & Interpretation",
          "General / Economy / Banking Awareness",
        ],
      },
      {
        name: "SBI Clerk",
        subjects: [
          "Numerical Ability",
          "Reasoning Ability",
          "English Language",
          "General / Financial Awareness",
        ],
      },
      {
        name: "RBI Grade B",
        subjects: [
          "General Awareness",
          "Quantitative Aptitude",
          "English Language",
          "Reasoning Ability",
          "Economic & Social Issues",
          "Finance & Management",
        ],
      },
      {
        name: "NABARD",
        subjects: [
          "Economic & Social Issues",
          "Agriculture & Rural Development",
          "Quantitative Aptitude",
          "Reasoning Ability",
          "English Language",
          "General Awareness",
          "Computer Knowledge",
        ],
      },
      {
        name: "IBPS RRB PO",
        subjects: [
          "Quantitative Aptitude",
          "Reasoning Ability",
          "Hindi / English Language",
          "General Awareness",
          "Computer Knowledge",
        ],
      },
      {
        name: "IBPS RRB Clerk",
        subjects: [
          "Numerical Ability",
          "Reasoning Ability",
          "Hindi / English Language",
          "General Awareness",
          "Computer Knowledge",
        ],
      },
    ],
  },
  {
    name: "Railway",
    exams: [
      {
        name: "RRB NTPC",
        subjects: [
          "Mathematics",
          "General Intelligence & Reasoning",
          "General Awareness",
          "General Science",
          "Current Affairs",
        ],
      },
      {
        name: "RRB Group D",
        subjects: [
          "Mathematics",
          "General Intelligence & Reasoning",
          "General Science",
          "General Awareness & Current Affairs",
        ],
      },
      {
        name: "RRB JE",
        subjects: [
          "Mathematics",
          "General Intelligence & Reasoning",
          "General Awareness",
          "General Science",
          "Technical Ability (CE / ME / EE / ECE / CS)",
        ],
      },
      {
        name: "RRB ALP",
        subjects: [
          "Mathematics",
          "General Intelligence & Reasoning",
          "General Science",
          "General Awareness",
          "Basic Science & Engineering",
        ],
      },
      {
        name: "RPF Constable",
        subjects: [
          "General Awareness",
          "Arithmetic",
          "General Intelligence & Reasoning",
        ],
      },
      {
        name: "RPF SI",
        subjects: [
          "General Awareness",
          "Arithmetic",
          "General Intelligence & Reasoning",
        ],
      },
    ],
  },
  {
    name: "IIT-JEE",
    exams: [
      {
        name: "JEE Main",
        subjects: [
          "Physics",
          "Chemistry (Physical)",
          "Chemistry (Organic)",
          "Chemistry (Inorganic)",
          "Mathematics",
        ],
      },
      {
        name: "JEE Advanced",
        subjects: [
          "Physics",
          "Chemistry (Physical)",
          "Chemistry (Organic)",
          "Chemistry (Inorganic)",
          "Mathematics",
        ],
      },
    ],
  },
  {
    name: "NEET",
    exams: [
      {
        name: "NEET UG",
        subjects: [
          "Physics",
          "Chemistry (Physical)",
          "Chemistry (Organic)",
          "Chemistry (Inorganic)",
          "Biology (Botany)",
          "Biology (Zoology)",
        ],
      },
      {
        name: "NEET PG",
        subjects: [
          "Anatomy",
          "Physiology",
          "Biochemistry",
          "Pathology",
          "Pharmacology",
          "Microbiology",
          "Forensic Medicine",
          "Community Medicine",
          "Medicine",
          "Surgery",
          "Obstetrics & Gynaecology",
          "Paediatrics",
          "Ophthalmology",
          "ENT",
          "Orthopaedics",
          "Radiology",
          "Psychiatry",
          "Dermatology",
          "Anaesthesia",
        ],
      },
    ],
  },
  {
    name: "UPSC",
    exams: [
      {
        name: "UPSC CSE Prelims",
        subjects: [
          "Indian Polity & Governance",
          "Indian Economy",
          "History (Ancient / Medieval / Modern)",
          "Geography",
          "Environment & Ecology",
          "Science & Technology",
          "Current Affairs",
          "CSAT (Aptitude)",
        ],
      },
      {
        name: "UPSC CSE Mains",
        subjects: [
          "Essay",
          "General Studies I (History, Culture, Society)",
          "General Studies II (Governance, Polity, IR)",
          "General Studies III (Economy, S&T, Environment)",
          "General Studies IV (Ethics, Integrity, Aptitude)",
          "Optional Subject",
          "English (Qualifying)",
          "Indian Language (Qualifying)",
        ],
      },
      {
        name: "UPSC CDS",
        subjects: [
          "English",
          "General Knowledge",
          "Elementary Mathematics",
        ],
      },
      {
        name: "UPSC NDA",
        subjects: [
          "Mathematics",
          "General Ability (English)",
          "General Ability (GK)",
          "General Ability (Science)",
          "General Ability (History & Geography)",
          "General Ability (Current Affairs)",
        ],
      },
      {
        name: "UPSC CAPF",
        subjects: [
          "General Ability & Intelligence",
          "General Studies, Essay & Comprehension",
        ],
      },
    ],
  },
  {
    name: "GATE",
    exams: [
      {
        name: "GATE CSE",
        subjects: [
          "Engineering Mathematics",
          "General Aptitude",
          "Discrete Mathematics",
          "Data Structures & Algorithms",
          "Programming & DS",
          "Operating Systems",
          "DBMS",
          "Computer Networks",
          "Theory of Computation",
          "Compiler Design",
          "Computer Organization & Architecture",
          "Digital Logic",
        ],
      },
      {
        name: "GATE ECE",
        subjects: [
          "Engineering Mathematics",
          "General Aptitude",
          "Networks, Signals & Systems",
          "Electronic Devices",
          "Analog Circuits",
          "Digital Circuits",
          "Control Systems",
          "Communications",
          "Electromagnetics",
        ],
      },
      {
        name: "GATE EE",
        subjects: [
          "Engineering Mathematics",
          "General Aptitude",
          "Electric Circuits",
          "Electromagnetic Fields",
          "Signals & Systems",
          "Electrical Machines",
          "Power Systems",
          "Control Systems",
          "Power Electronics",
        ],
      },
      {
        name: "GATE ME",
        subjects: [
          "Engineering Mathematics",
          "General Aptitude",
          "Engineering Mechanics",
          "Strength of Materials",
          "Thermodynamics",
          "Fluid Mechanics",
          "Heat Transfer",
          "Manufacturing Engineering",
          "Machine Design",
          "Theory of Machines",
          "Industrial Engineering",
        ],
      },
      {
        name: "GATE CE",
        subjects: [
          "Engineering Mathematics",
          "General Aptitude",
          "Structural Engineering",
          "Geotechnical Engineering",
          "Water Resources Engineering",
          "Environmental Engineering",
          "Transportation Engineering",
          "Surveying",
          "Construction Materials & Management",
        ],
      },
      {
        name: "GATE Other Branch",
        subjects: [
          "Engineering Mathematics",
          "General Aptitude",
          "Core Subject",
        ],
      },
    ],
  },
  {
    name: "CAT",
    exams: [
      {
        name: "CAT",
        subjects: [
          "Quantitative Aptitude",
          "Data Interpretation & Logical Reasoning",
          "Verbal Ability & Reading Comprehension",
        ],
      },
      {
        name: "XAT",
        subjects: [
          "Verbal & Logical Ability",
          "Decision Making",
          "Quantitative Aptitude & Data Interpretation",
          "General Knowledge",
        ],
      },
      {
        name: "SNAP",
        subjects: [
          "General English",
          "Quantitative Aptitude, DI & DS",
          "Analytical & Logical Reasoning",
        ],
      },
      {
        name: "NMAT",
        subjects: [
          "Language Skills",
          "Quantitative Skills",
          "Logical Reasoning",
        ],
      },
      {
        name: "MAT",
        subjects: [
          "Language Comprehension",
          "Mathematical Skills",
          "Data Analysis & Sufficiency",
          "Intelligence & Critical Reasoning",
          "Indian & Global Environment",
        ],
      },
    ],
  },
  {
    name: "CLAT",
    exams: [
      {
        name: "CLAT UG",
        subjects: [
          "English Language",
          "Current Affairs & General Knowledge",
          "Legal Reasoning",
          "Logical Reasoning",
          "Quantitative Techniques",
        ],
      },
      {
        name: "CLAT PG",
        subjects: [
          "Constitutional Law",
          "Jurisprudence",
          "Contract Law",
          "Criminal Law",
          "International Law",
          "Other Law Subjects",
        ],
      },
      {
        name: "AILET",
        subjects: [
          "English",
          "General Knowledge & Current Affairs",
          "Legal Aptitude",
          "Reasoning",
          "Mathematics",
        ],
      },
      {
        name: "LSAT India",
        subjects: [
          "Analytical Reasoning",
          "Logical Reasoning (1 & 2)",
          "Reading Comprehension",
        ],
      },
    ],
  },
  {
    name: "Defence",
    exams: [
      {
        name: "AFCAT",
        subjects: [
          "General Awareness",
          "Verbal Ability (English)",
          "Numerical Ability",
          "Reasoning & Military Aptitude",
        ],
      },
      {
        name: "Indian Navy AA/SSR",
        subjects: [
          "English",
          "Science",
          "Mathematics",
          "General Awareness",
        ],
      },
    ],
  },
  {
    name: "State Exams",
    exams: [
      {
        name: "State PSC",
        subjects: [
          "General Studies",
          "Indian Polity",
          "Indian Economy",
          "History",
          "Geography",
          "Science & Technology",
          "Current Affairs",
          "State-specific GK",
        ],
      },
      {
        name: "State Police",
        subjects: [
          "General Knowledge",
          "Reasoning",
          "Quantitative Aptitude",
          "Hindi / English / Regional Language",
        ],
      },
      {
        name: "State TET / CTET",
        subjects: [
          "Child Development & Pedagogy",
          "Language I",
          "Language II",
          "Mathematics",
          "Environmental Studies",
          "Social Studies / Science",
        ],
      },
    ],
  },
  {
    name: "Other",
    exams: [
      {
        name: "CA Foundation",
        subjects: [
          "Accounting",
          "Business Law",
          "Quantitative Aptitude",
          "Business Economics",
        ],
      },
      {
        name: "CA Inter",
        subjects: [
          "Accounting",
          "Corporate Law & Other Laws",
          "Cost & Management Accounting",
          "Taxation (Direct & Indirect)",
          "Advanced Accounting",
          "Auditing & Assurance",
          "Financial Management & Economics",
          "Strategic Management",
        ],
      },
      {
        name: "Boards (CBSE)",
        subjects: [
          "Physics",
          "Chemistry",
          "Mathematics",
          "Biology",
          "English",
          "Hindi",
          "Social Science",
          "Computer Science",
          "Accounts",
          "Business Studies",
          "Economics",
        ],
      },
      {
        name: "Boards (ICSE/ISC)",
        subjects: [
          "Physics",
          "Chemistry",
          "Mathematics",
          "Biology",
          "English",
          "Computer Science",
          "Accounts",
          "Economics",
          "Commerce",
        ],
      },
      {
        name: "Other",
        subjects: [
          "General",
          "Physics",
          "Chemistry",
          "Mathematics",
          "Biology",
          "English",
          "Reasoning",
          "General Knowledge",
          "Other",
        ],
      },
    ],
  },
];

/** Flat list of all exam names. */
export const ALL_EXAMS = EXAM_CATEGORIES.flatMap((c) => c.exams.map((e) => e.name));

/** Get the category for a given exam name. */
export function getCategoryForExam(exam: string): ExamCategory | undefined {
  return EXAM_CATEGORIES.find((c) => c.exams.some((e) => e.name === exam));
}

/** Get subjects for a given exam name. */
export function getSubjectsForExam(exam: string): string[] {
  for (const cat of EXAM_CATEGORIES) {
    const entry = cat.exams.find((e) => e.name === exam);
    if (entry) return entry.subjects;
  }
  return ["General", "Other"];
}
