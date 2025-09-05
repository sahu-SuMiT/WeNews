const { db } = require('../config/firebase');

const investmentPlans = [
  {
    name: 'Bass',
    joiningAmount: 1499,
    levels: 13,
    validity: 750,
    dailyReturn: 25,
    weeklyReturn: 149,
    monthlyReturn: 699,
    isActive: true
  },
  {
    name: 'Silver',
    joiningAmount: 2499,
    levels: 13,
    validity: 750,
    dailyReturn: 50,
    weeklyReturn: 349,
    monthlyReturn: 1499,
    isActive: true
  },
  {
    name: 'Gold',
    joiningAmount: 3499,
    levels: 13,
    validity: 750,
    dailyReturn: 100,
    weeklyReturn: 699,
    monthlyReturn: 2999,
    isActive: true
  },
  {
    name: 'Diamond',
    joiningAmount: 3999,
    levels: 13,
    validity: 750,
    dailyReturn: 200,
    weeklyReturn: 1399,
    monthlyReturn: 5999,
    isActive: true
  },
  {
    name: 'Platinum',
    joiningAmount: 4999,
    levels: 13,
    validity: 750,
    dailyReturn: 300,
    weeklyReturn: 1999,
    monthlyReturn: 8999,
    isActive: true
  },
  {
    name: 'Eight',
    joiningAmount: 6999,
    levels: 13,
    validity: 750,
    dailyReturn: 500,
    weeklyReturn: 2999,
    monthlyReturn: 12999,
    isActive: true
  }
];

const levelStructure = [
  { level: 1, openAfterDays: 7, requiredReferrals: 3, chainLevel: 'c1', payouts: { bass: 300, silver: 400, gold: 500, diamond: 600, platinum: 700, eight: 800 } },
  { level: 2, openAfterDays: 22, requiredReferrals: 6, chainLevel: 'c2', payouts: { bass: 150, silver: 200, gold: 250, diamond: 300, platinum: 350, eight: 400 } },
  { level: 3, openAfterDays: 52, requiredReferrals: 27, chainLevel: 'c3', payouts: { bass: 75, silver: 100, gold: 125, diamond: 150, platinum: 175, eight: 200 } },
  { level: 4, openAfterDays: 100, requiredReferrals: 81, chainLevel: 'c4', payouts: { bass: 50, silver: 75, gold: 100, diamond: 125, platinum: 150, eight: 175 } },
  { level: 5, openAfterDays: 160, requiredReferrals: 243, chainLevel: 'c5', payouts: { bass: 25, silver: 50, gold: 75, diamond: 100, platinum: 125, eight: 150 } },
  { level: 6, openAfterDays: 220, requiredReferrals: 729, chainLevel: 'c6', payouts: { bass: 0, silver: 25, gold: 50, diamond: 75, platinum: 100, eight: 125 } },
  { level: 7, openAfterDays: 280, requiredReferrals: 2187, chainLevel: 'c7', payouts: { bass: 0, silver: 0, gold: 25, diamond: 50, platinum: 75, eight: 100 } },
  { level: 8, openAfterDays: 340, requiredReferrals: 6561, chainLevel: 'c8', payouts: { bass: 0, silver: 0, gold: 10, diamond: 25, platinum: 50, eight: 75 } },
  { level: 9, openAfterDays: 400, requiredReferrals: 19683, chainLevel: 'c9', payouts: { bass: 0, silver: 0, gold: 0, diamond: 10, platinum: 25, eight: 50 } },
  { level: 10, openAfterDays: 460, requiredReferrals: 59049, chainLevel: 'c10', payouts: { bass: 0, silver: 0, gold: 0, diamond: 5, platinum: 10, eight: 25 } },
  { level: 11, openAfterDays: 520, requiredReferrals: 177147, chainLevel: 'c11', payouts: { bass: 0, silver: 0, gold: 0, diamond: 0, platinum: 5, eight: 10 } },
  { level: 12, openAfterDays: 600, requiredReferrals: 531441, chainLevel: 'c12', payouts: { bass: 0, silver: 0, gold: 0, diamond: 0, platinum: 0, eight: 5 } },
  { level: 13, openAfterDays: 750, requiredReferrals: 1594323, chainLevel: 'c13', payouts: { bass: 0, silver: 0, gold: 0, diamond: 0, platinum: 0, eight: 0 } },
  { level: 14, openAfterDays: 875, requiredReferrals: 4782969, chainLevel: 'c14', payouts: { bass: 0, silver: 0, gold: 0, diamond: 0, platinum: 0, eight: 0 } },
  { level: 15, openAfterDays: 1000, requiredReferrals: 14348907, chainLevel: 'c15', payouts: { bass: 0, silver: 0, gold: 0, diamond: 0, platinum: 0, eight: 0 } }
];

async function initializeInvestmentData() {
  try {
    console.log('Initializing investment plans...');
    
    // Clear existing data
    console.log('Clearing existing investment plans...');
    const existingPlansSnapshot = await db.collection('investmentPlans').get();
    const batch1 = db.batch();
    existingPlansSnapshot.docs.forEach(doc => {
      batch1.delete(doc.ref);
    });
    await batch1.commit();

    console.log('Clearing existing level structure...');
    const existingLevelsSnapshot = await db.collection('levelStructure').get();
    const batch2 = db.batch();
    existingLevelsSnapshot.docs.forEach(doc => {
      batch2.delete(doc.ref);
    });
    await batch2.commit();

    // Add investment plans
    for (const plan of investmentPlans) {
      await db.collection('investmentPlans').add({
        ...plan,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      console.log(`Added investment plan: ${plan.name}`);
    }

    // Add level structure
    for (const level of levelStructure) {
      await db.collection('levelStructure').add({
        ...level,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      console.log(`Added level ${level.level}: ${level.chainLevel}`);
    }

    console.log('Investment data initialized successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error initializing investment data:', error);
    process.exit(1);
  }
}

initializeInvestmentData();
