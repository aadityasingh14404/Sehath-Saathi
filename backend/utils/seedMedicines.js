import medicineModel from "../models/medicineModel.js";
import stockModel from "../models/stockModel.js";

const sampleMedicines = [
    {
        name: "Paracetamol",
        genericName: "Acetaminophen",
        brandName: "Crocin",
        category: "Pain Relief",
        description: "Used for pain relief and reducing fever",
        dosage: "500mg",
        form: "Tablet",
        manufacturer: "GSK",
        price: 25,
        costPrice: 15,
        prescriptionRequired: false,
        sideEffects: ["Nausea", "Stomach upset"],
        contraindications: ["Liver disease"],
        drugInteractions: ["Warfarin"],
        storageConditions: "Store in cool, dry place"
    },
    {
        name: "Amoxicillin",
        genericName: "Amoxicillin",
        brandName: "Amoxil",
        category: "Antibiotic",
        description: "Antibiotic used to treat bacterial infections",
        dosage: "250mg",
        form: "Capsule",
        manufacturer: "Pfizer",
        price: 45,
        costPrice: 30,
        prescriptionRequired: true,
        sideEffects: ["Diarrhea", "Nausea", "Rash"],
        contraindications: ["Penicillin allergy"],
        drugInteractions: ["Warfarin", "Methotrexate"],
        storageConditions: "Store in refrigerator"
    },
    {
        name: "Metformin",
        genericName: "Metformin",
        brandName: "Glucophage",
        category: "Diabetes",
        description: "Used to treat type 2 diabetes",
        dosage: "500mg",
        form: "Tablet",
        manufacturer: "Merck",
        price: 35,
        costPrice: 25,
        prescriptionRequired: true,
        sideEffects: ["Nausea", "Diarrhea", "Metallic taste"],
        contraindications: ["Kidney disease", "Liver disease"],
        drugInteractions: ["Alcohol", "Contrast agents"],
        storageConditions: "Store at room temperature"
    },
    {
        name: "Omeprazole",
        genericName: "Omeprazole",
        brandName: "Prilosec",
        category: "Digestive",
        description: "Proton pump inhibitor for acid reflux",
        dosage: "20mg",
        form: "Capsule",
        manufacturer: "AstraZeneca",
        price: 55,
        costPrice: 40,
        prescriptionRequired: true,
        sideEffects: ["Headache", "Nausea", "Diarrhea"],
        contraindications: ["Severe liver disease"],
        drugInteractions: ["Warfarin", "Phenytoin"],
        storageConditions: "Store at room temperature"
    },
    {
        name: "Cetirizine",
        genericName: "Cetirizine",
        brandName: "Zyrtec",
        category: "Other",
        description: "Antihistamine for allergies",
        dosage: "10mg",
        form: "Tablet",
        manufacturer: "Johnson & Johnson",
        price: 30,
        costPrice: 20,
        prescriptionRequired: false,
        sideEffects: ["Drowsiness", "Dry mouth"],
        contraindications: ["Severe kidney disease"],
        drugInteractions: ["Alcohol", "CNS depressants"],
        storageConditions: "Store at room temperature"
    },
    {
        name: "Aspirin",
        genericName: "Acetylsalicylic Acid",
        brandName: "Bayer",
        category: "Pain Relief",
        description: "Pain reliever and blood thinner",
        dosage: "75mg",
        form: "Tablet",
        manufacturer: "Bayer",
        price: 20,
        costPrice: 12,
        prescriptionRequired: false,
        sideEffects: ["Stomach irritation", "Bleeding risk"],
        contraindications: ["Peptic ulcer", "Bleeding disorders"],
        drugInteractions: ["Warfarin", "Alcohol"],
        storageConditions: "Store in cool, dry place"
    },
    {
        name: "Lisinopril",
        genericName: "Lisinopril",
        brandName: "Zestril",
        category: "Cardiovascular",
        description: "ACE inhibitor for blood pressure",
        dosage: "10mg",
        form: "Tablet",
        manufacturer: "AstraZeneca",
        price: 40,
        costPrice: 28,
        prescriptionRequired: true,
        sideEffects: ["Dry cough", "Dizziness", "Fatigue"],
        contraindications: ["Pregnancy", "Bilateral renal artery stenosis"],
        drugInteractions: ["Potassium supplements", "NSAIDs"],
        storageConditions: "Store at room temperature"
    },
    {
        name: "Salbutamol",
        genericName: "Albuterol",
        brandName: "Ventolin",
        category: "Respiratory",
        description: "Bronchodilator for asthma",
        dosage: "100mcg",
        form: "Inhaler",
        manufacturer: "GSK",
        price: 120,
        costPrice: 85,
        prescriptionRequired: true,
        sideEffects: ["Tremor", "Nervousness", "Headache"],
        contraindications: ["Hypersensitivity"],
        drugInteractions: ["Beta-blockers"],
        storageConditions: "Store at room temperature"
    },
    {
        name: "Multivitamin",
        genericName: "Multivitamin",
        brandName: "Centrum",
        category: "Vitamins",
        description: "Daily multivitamin supplement",
        dosage: "1 tablet",
        form: "Tablet",
        manufacturer: "Pfizer",
        price: 80,
        costPrice: 55,
        prescriptionRequired: false,
        sideEffects: ["Nausea", "Constipation"],
        contraindications: ["Iron overload"],
        drugInteractions: ["Antacids", "Tetracycline"],
        storageConditions: "Store at room temperature"
    },
    {
        name: "Hydrocortisone",
        genericName: "Hydrocortisone",
        brandName: "Cortizone",
        category: "Dermatological",
        description: "Topical steroid for skin conditions",
        dosage: "1%",
        form: "Cream",
        manufacturer: "Pfizer",
        price: 65,
        costPrice: 45,
        prescriptionRequired: false,
        sideEffects: ["Skin thinning", "Burning sensation"],
        contraindications: ["Viral skin infections"],
        drugInteractions: ["None significant"],
        storageConditions: "Store at room temperature"
    }
];

const sampleStock = [
    {
        currentStock: 500,
        minimumStock: 50,
        maximumStock: 1000,
        reorderLevel: 100,
        expiryDate: new Date('2025-12-31'),
        batchNumber: 'PC2024001',
        supplier: 'MedSupply Co.',
        purchaseDate: new Date('2024-01-15'),
        purchasePrice: 15,
        sellingPrice: 25
    },
    {
        currentStock: 200,
        minimumStock: 30,
        maximumStock: 500,
        reorderLevel: 50,
        expiryDate: new Date('2025-08-15'),
        batchNumber: 'AM2024002',
        supplier: 'PharmaDist',
        purchaseDate: new Date('2024-02-01'),
        purchasePrice: 30,
        sellingPrice: 45
    },
    {
        currentStock: 150,
        minimumStock: 25,
        maximumStock: 300,
        reorderLevel: 40,
        expiryDate: new Date('2025-10-20'),
        batchNumber: 'MF2024003',
        supplier: 'HealthCare Supply',
        purchaseDate: new Date('2024-01-20'),
        purchasePrice: 25,
        sellingPrice: 35
    },
    {
        currentStock: 80,
        minimumStock: 20,
        maximumStock: 200,
        reorderLevel: 30,
        expiryDate: new Date('2025-06-30'),
        batchNumber: 'OM2024004',
        supplier: 'MedSupply Co.',
        purchaseDate: new Date('2024-02-10'),
        purchasePrice: 40,
        sellingPrice: 55
    },
    {
        currentStock: 300,
        minimumStock: 40,
        maximumStock: 600,
        reorderLevel: 60,
        expiryDate: new Date('2025-11-15'),
        batchNumber: 'CT2024005',
        supplier: 'PharmaDist',
        purchaseDate: new Date('2024-01-25'),
        purchasePrice: 20,
        sellingPrice: 30
    },
    {
        currentStock: 25, // Low stock
        minimumStock: 30,
        maximumStock: 200,
        reorderLevel: 40,
        expiryDate: new Date('2025-09-10'),
        batchNumber: 'AS2024006',
        supplier: 'HealthCare Supply',
        purchaseDate: new Date('2024-02-05'),
        purchasePrice: 12,
        sellingPrice: 20
    },
    {
        currentStock: 120,
        minimumStock: 25,
        maximumStock: 250,
        reorderLevel: 35,
        expiryDate: new Date('2025-07-25'),
        batchNumber: 'LS2024007',
        supplier: 'MedSupply Co.',
        purchaseDate: new Date('2024-01-30'),
        purchasePrice: 28,
        sellingPrice: 40
    },
    {
        currentStock: 50,
        minimumStock: 15,
        maximumStock: 100,
        reorderLevel: 25,
        expiryDate: new Date('2025-05-20'),
        batchNumber: 'SB2024008',
        supplier: 'PharmaDist',
        purchaseDate: new Date('2024-02-15'),
        purchasePrice: 85,
        sellingPrice: 120
    },
    {
        currentStock: 200,
        minimumStock: 50,
        maximumStock: 400,
        reorderLevel: 75,
        expiryDate: new Date('2025-12-10'),
        batchNumber: 'MV2024009',
        supplier: 'HealthCare Supply',
        purchaseDate: new Date('2024-01-10'),
        purchasePrice: 55,
        sellingPrice: 80
    },
    {
        currentStock: 90,
        minimumStock: 20,
        maximumStock: 150,
        reorderLevel: 30,
        expiryDate: new Date('2025-08-30'),
        batchNumber: 'HC2024010',
        supplier: 'MedSupply Co.',
        purchaseDate: new Date('2024-02-20'),
        purchasePrice: 45,
        sellingPrice: 65
    }
];

export const seedMedicines = async () => {
    try {
        // Clear existing data
        await medicineModel.deleteMany({});
        await stockModel.deleteMany({});

        // Insert medicines
        const medicines = await medicineModel.insertMany(sampleMedicines);
        console.log(`✅ Inserted ${medicines.length} medicines`);

        // Insert stock for each medicine
        const stocks = [];
        for (let i = 0; i < medicines.length; i++) {
            const stockData = {
                ...sampleStock[i],
                medicineId: medicines[i]._id
            };
            stocks.push(stockData);
        }

        await stockModel.insertMany(stocks);
        console.log(`✅ Inserted ${stocks.length} stock records`);

        console.log('🎉 Medicine database seeded successfully!');
    } catch (error) {
        console.error('❌ Error seeding medicine database:', error);
    }
};

export default { seedMedicines };
