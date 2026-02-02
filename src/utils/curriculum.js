export const engineeringMinors = {
    "Cloud Computing": ["INT330", "INT362", "INT363", "INT364", "INT327"],
    "Cyber Security": ["INT242", "INT244", "INT249", "INT250", "INT251"],
    "Data Science": ["INT217", "INT233", "INT234", "INT312", "INT315", "INT374", "INT375"],
    "Machine Learning": ["INT254", "INT344", "INT345", "INT354", "INT422", "INT423"],
    "Full Stack Web Development": ["INT219", "INT220", "INT221", "INT222", "INT252", "INT253"],
    "Internet of Things (IOT)": ["ECE217", "ECE237", "ECE341", "ECE128", "ECE129", "ECE140"],
    "Software Methodologies and Testing": ["CSE374", "CSE375", "CSE376", "CSE377","CSE378", "CSE379"]
    
};

export const pathwayElectives = {
    "Government Jobs": ["PEA306", "PEA308", "CSE333", "CSE334"],
    "Higher Studies": ["PEA306", "PEA308", "CSE333", "CSE334"],
    "Product Based": ["CSE329", "CSE333", "CSE330", "CSE331"],
    "Service Based": ["PEA308", "PEA306", "PEV301", "CSE357"]
};

export const openMinors = {
    "Android Application Development": ["CSE224", "CSE225", "CSE226", "CSE227", "INT397"],
    "Banking and Financial Services": ["FIN314", "FIN318", "FIN319", "FIN901"],
    "Business Laws": ["LAW252", "LAW255", "LAW256", "LAW257"],
    "DevOps": ["INT331", "INT332", "INT333", "INT334"]
};
export const curriculum = {
    "1": {
        "CORE_ELECTIVE_1_SLOT": { "credit": 4 },
        "CORE_ELECTIVE_2_SLOT": { "credit": 2 },
        "CORE_ELECTIVE_3_SLOT": { "credit": 1 },
        "CSE111": { "credit": 2 },
        "CSE326": { "credit": 2 },
        "INT108": { "credit": 4 },
        "MTH174": { "credit": 4 },
        "PES318": { "credit": 3 },
        "CORE_ELECTIVE_1_BASKET": { "ECE249": { "credit": 4 }, "MEC136": { "credit": 4 } },
        "CORE_ELECTIVE_2_BASKET": { "CHE110": { "credit": 2 }, "PHY110": { "credit": 3 } },
        "CORE_ELECTIVE_3_BASKET": { "ECE279": { "credit": 1 } }
    },
    "2": {
        "CORE_ELECTIVE_1_SLOT": { "credit": 4 },
        "CORE_ELECTIVE_2_SLOT": { "credit": 2 },
        "CORE_ELECTIVE_3_SLOT": { "credit": 1 },
        "LANGUAGE_ELECTIVE_1_SLOT": { "credit": 3 },
        "CSE101": { "credit": 4 },
        "CSE121": { "credit": 2 },
        "CSE320": { "credit": 3 },
        "INT306": { "credit": 4 },
        "MTH401": { "credit": 3 },
        "CORE_ELECTIVE_1_BASKET": { "ECE249": { "credit": 4 }, "MEC136": { "credit": 4 } },
        "CORE_ELECTIVE_2_BASKET": { "CHE110": { "credit": 2 }, "PHY110": { "credit": 3 } },
        "CORE_ELECTIVE_3_BASKET": { "ECE279": { "credit": 1 } },
        "LANGUAGE_ELECTIVE_1_BASKET": { "PEL125": { "credit": 3 }, "PEL130": { "credit": 3 }, "PEL121": { "credit": 3 } }
    },
    "3": {
        "CORE_ELECTIVE_4_SLOT": { "credit": 3 },
        "CORE_ELECTIVE_5_SLOT": { "credit": 1 },
        "LANGUAGE_ELECTIVE_2_SLOT": { "credit": 3 },
        "CSE202": { "credit": 4 },
        "CSE205": { "credit": 4 },
        "CSE211": { "credit": 4 },
        "CSE306": { "credit": 3 },
        "CSE307": { "credit": 1 },
        "GEN231": { "credit": 2 },
        "CORE_ELECTIVE_4_BASKET": { "CSE316": { "credit": 3 }, "MTH302": { "credit": 4 } },
        "CORE_ELECTIVE_5_BASKET": { "CSE325": { "credit": 1 } },
        "LANGUAGE_ELECTIVE_2_BASKET": { "PEL132": { "credit": 3 }, "PEL134": { "credit": 3 }, "PEL136": { "credit": 3 } }
    },
    "4": {
        "APTITUDE_ELECTIVE_1_SLOT": { "credit": 3 },
        "CORE_ELECTIVE_4_SLOT": { "credit": 3 },
        "CORE_ELECTIVE_5_SLOT": { "credit": 1 },
        "ENGINEERING_MINOR_ELECTIVE_1_SLOT": { "credit": 3 },
        "ENGINEERING_MINOR_ELECTIVE_2_SLOT": { "credit": 3 },
        "CSE310": { "credit": 4 },
        "CSE408": { "credit": 3 },
        "INT428": { "credit": 4 },
        "APTITUDE_ELECTIVE_1_BASKET": { "PEA305": { "credit": 3 }, "PEA307": { "credit": 3 } },
        "CORE_ELECTIVE_4_BASKET": { "CSE316": { "credit": 3 }, "MTH302": { "credit": 4 } },
        "CORE_ELECTIVE_5_BASKET": { "CSE325": { "credit": 1 } },
        "ENGINEERING_MINOR_ELECTIVE_1_BASKET": { "INT330": { "credit": 3 }, "INT242": { "credit": 3 }, "INT217": { "credit": 3 }, "INT219": { "credit": 3 }, "ECE217": { "credit": 3 }, "INT254": { "credit": 3 }, "CSE374": { "credit": 3 } },
        "ENGINEERING_MINOR_ELECTIVE_2_BASKET": { "INT362": { "credit": 3 }, "INT249": { "credit": 3 }, "INT375": { "credit": 3 }, "INT220": { "credit": 3 }, "ECE341": { "credit": 3 }, "INT354": { "credit": 3 }, "CSE375": { "credit": 3 } }
    },
    "5": {
        "ENGINEERING_MINOR_ELECTIVE_3_SLOT": { "credit": 3 },
        "ENGINEERING_MINOR_ELECTIVE_4_SLOT": { "credit": 3 },
        "OPEN_MINOR_1_SLOT": { "credit": 3 },
        "PATHWAY_ELECTIVE_1_SLOT": { "credit": 3 },
        "PATHWAY_ELECTIVE_2_SLOT": { "credit": 3 },
        "TRAINING_ELECTIVE_1_SLOT": { "credit": 3 },
        "CSE322": { "credit": 3 },
        "ENGINEERING_MINOR_ELECTIVE_3_BASKET": { "INT363": { "credit": 3 }, "INT250": { "credit": 3 }, "INT374": { "credit": 3 }, "INT252": { "credit": 3 }, "ECE128": { "credit": 3 }, "INT344": { "credit": 3 }, "CSE376": { "credit": 3 } },
        "ENGINEERING_MINOR_ELECTIVE_4_BASKET": { "INT364": { "credit": 3 }, "INT244": { "credit": 3 }, "INT234": { "credit": 3 }, "INT222": { "credit": 3 }, "ECE237": { "credit": 3 }, "INT423": { "credit": 3 }, "CSE377": { "credit": 3 } },
        "PATHWAY_ELECTIVE_1_BASKET": { "PEA306": { "credit": 3 }, "PEA308": { "credit": 3 }, "CSE329": { "credit": 3 } },
        "TRAINING_ELECTIVE_1_BASKET": { "CSE343": { "credit": 3 }, "CSE443": { "credit": 3 } },
        "OPEN_MINOR_1_BASKET": {
            "CSE224": { "credit": 3 }, "CSE225": { "credit": 3 }, "CSE226": { "credit": 3 }, "CSE227": { "credit": 3 },
            "INT397": { "credit": 3 }, "INT398": { "credit": 3 }, "INT399": { "credit": 3 }, "INT400": { "credit": 3 },
            "FIN314": { "credit": 3 }, "FIN318": { "credit": 3 }, "FIN319": { "credit": 3 }, "FIN901": { "credit": 3 },
            "LAW252": { "credit": 3 }, "LAW255": { "credit": 3 }, "LAW256": { "credit": 3 }, "LAW257": { "credit": 3 },
            "INT327": { "credit": 3 }, "INT328": { "credit": 3 }, "INT330": { "credit": 3 }, "INT362": { "credit": 3 },
            "INT363": { "credit": 3 }, "INT364": { "credit": 3 }, "INT373": { "credit": 3 }, "INT377": { "credit": 3 },
            "INT378": { "credit": 3 }, "INT379": { "credit": 3 }, "INT242": { "credit": 3 }, "INT244": { "credit": 3 },
            "INT245": { "credit": 3 }, "INT249": { "credit": 3 }, "INT250": { "credit": 3 }, "INT251": { "credit": 3 },
            "INT217": { "credit": 3 }, "INT233": { "credit": 3 }, "INT234": { "credit": 3 }, "INT312": { "credit": 3 },
            "INT315": { "credit": 3 }, "INT374": { "credit": 3 }, "INT375": { "credit": 3 }, "INT331": { "credit": 3 },
            "INT332": { "credit": 3 }, "INT333": { "credit": 3 }, "INT334": { "credit": 3 }, "MKT311": { "credit": 2 },
            "MKT905": { "credit": 3 }, "MKT906": { "credit": 2 }, "MKT907": { "credit": 2 }, "ECO214": { "credit": 3 },
            "ECO215": { "credit": 3 }, "ECO324": { "credit": 3 }, "ECO325": { "credit": 3 }, "ENG606": { "credit": 3 },
            "ENG607": { "credit": 3 }, "ENG608": { "credit": 3 }, "ENG609": { "credit": 3 }, "FST801": { "credit": 3 },
            "FST802": { "credit": 3 }, "FST803": { "credit": 3 }, "FST804": { "credit": 3 }, "FIN214": { "credit": 3 },
            "FIN215": { "credit": 3 }
        }
    },
    "6": {
        "ENGINEERING_MINOR_ELECTIVE_5_SLOT": { "credit": 3 },
        "OPEN_MINOR_2_SLOT": { "credit": 3 },
        "PATHWAY_ELECTIVE_3_SLOT": { "credit": 3 },
        "PATHWAY_ELECTIVE_4_SLOT": { "credit": 3 },
        "CSE332": { "credit": 2 },
        "CSE393": { "credit": 3 },
        "ENGINEERING_MINOR_ELECTIVE_5_BASKET": { "INT327": { "credit": 3 }, "INT245": { "credit": 3 }, "INT312": { "credit": 3 }, "INT221": { "credit": 3 }, "ECE129": { "credit": 3 }, "INT345": { "credit": 3 }, "CSE378": { "credit": 3 } },
        "PATHWAY_ELECTIVE_3_BASKET": { "CSE334": { "credit": 3 }, "CSE331": { "credit": 3 }, "CSE357": { "credit": 3 } },
        "PATHWAY_ELECTIVE_4_BASKET": { "PES319": { "credit": 3 } },
        "OPEN_MINOR_2_BASKET": { "Various_Open_Minor_Courses": { "note": "see Term5 open minor basket for full list" } }
    },
    "7": {
        "COURSEWORK_VARIANT": {
            "DEPARTMENT_ELECTIVE_1_SLOT": { "credit": 3 },
            "DEPARTMENT_ELECTIVE_1_LAB_SLOT": { "credit": 1 },
            "ENGINEERING_MINOR_ELECTIVE_6_SLOT": { "credit": 3 },
            "OPEN_MINOR_3_SLOT": { "credit": 3 },
            "PATHWAY_ELECTIVE_4_SLOT": { "credit": 3 },
            "CSE339_CAPSTONE_PROJECT_I": { "credit": 2 },
            "DEPARTMENT_ELECTIVE_1_BASKET": { "CSE304": { "credit": 4 }, "CSE327": { "credit": 3 }, "CSE406": { "credit": 4 }, "CSE434": { "credit": 4 }, "CSE436": { "credit": 4 }, "INT402": { "credit": 4 } },
            "DEPARTMENT_ELECTIVE_1_LAB_BASKET": { "CSE328": { "credit": 1 } },
            "ENGINEERING_MINOR_ELECTIVE_6_BASKET": { "INT328": { "credit": 3 }, "INT251": { "credit": 3 }, "INT315": { "credit": 3 }, "INT253": { "credit": 3 }, "ECE140": { "credit": 3 }, "INT422": { "credit": 3 }, "CSE379": { "credit": 3 } }
        },
        "INTERNSHIP_VARIANT": {
            "CSE447_INDUSTRY_CO_OP_PROJECT_I": { "credit": 16 }
        }
    },
    "8": {
        "COURSEWORK_VARIANT": {
            "DEPARTMENT_ELECTIVE_2_SLOT": { "credit": 3 },
            "DEPARTMENT_ELECTIVE_2_LAB_SLOT": { "credit": 1 },
            "OPEN_MINOR_4_SLOT": { "credit": 3 },
            "CSE435_SEMINAR": { "credit": 1 },
            "CSE439_CAPSTONE_PROJECT_II": { "credit": 8 },
            "DEPARTMENT_ELECTIVE_2_BASKET": { "CSE493": { "credit": 4 }, "CSE504": { "credit": 3 }, "INT411": { "credit": 3 }, "CSE403": { "credit": 4 } },
            "DEPARTMENT_ELECTIVE_2_LAB_BASKET": { "CSE507": { "credit": 1 }, "INT416": { "credit": 2 } }
        },
        "INTERNSHIP_VARIANT": {
            "TRAINING_ELECTIVE_2_SLOT": { "credit": 16 },
            "TRAINING_ELECTIVE_2_BASKET": { "CSE441": { "credit": 16 }, "CSE448": { "credit": 16 } }
        },
        "OPEN_MINOR_4_BASKET": { "and_more": { "note": "Open Minor basket is large" } }
    }
};
