const Credit = requiire("../Models/Credit.models.js");

exports.getUserCredit = async (req, res) => {
  try {
    const userId = req.user.id;
    let credit = await Credit.findOne({ user: userId });
    if (!credit) {
      credit = await Credit.create({ user: userId });
    }
    // checks daily limit reseted or not
    if (credit.lastDailyReset) {
      const now = new Date();
      const lastReset = new Date(credit.lastDailyReset);
      const hoursSinceReset = (now - lastReset) / (1000 * 60 * 60);

      if (hoursSinceReset >= 24) {
        credit.dailyUsed = 0;
        credit.lastDailyReset = now;
        await credit.save();
      }
    }
    // checks monthly limit reseted or not
    if (credit.lastMonthlyReset) {
      const now = new Date();
      const lastReset = new Date(credit.lastMonthlyReset);
      const daysSinceReset = (now - lastReset) / (1000 * 60 * 60 * 24);

      if (daysSinceReset >= 30) {
        credit.monthlyUsed = 0;
        credit.lastMonthlyReset = now;
        await credit.save();
      }
    }
    //if subscripton expires
    if (
      credit.subscriptionExpiresAt &&
      new Date() > credit.subscriptionExpiresAt
    ) {
      credit.subscriptionStatus = "expired";
      credit.plan = "free";
      credit.isUnlimited = false;
      await credit.save();
    }

    res.status(200).json({
      success: true,
      data: credit,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Eror to fetching Credits",
      error: error.message,
    });
  }
};

exports.deductCredits = async (req, res) => {
  try {
    const userId = req.user.id;
    const { amount = 1 } = req.body;
    const credit = await Credit.findOne({ user: userId });
    if (!credit) {
      return res.status(404).json({
        success: false,
        message: "Credit record not found",
      });
    }
    // check if user has unlimited access
    if (credit.isUnlimited) {
      credit.totalGenerations += 1;
      await credit.save();
      return res.status(200).json({
        success: true,
        message: "Generation successfull (unlimited plan)",
        data: credit,
      });
    }
    //check daily limit
    if (credit.dailyLimit > 0 && credit.dailyUsed >= credit.dailyLimit) {
      return res.status(403).json({
        success: false,
        message:
          "Daily Limit reached. Please Upgrade youre plan or wait until tommorow...",
      });
    }
    //check monthly limit
    if(credit.monthlyLimit > 0 && credit.monthlyUsed >= credit.monthlyLimit){
        return res.status(403).json({
            success: false,
            message: "Monthly Limit reached.",
        });
    }
    //chack user has enough Balance
    const totalAvailable = credit.balance + credit.bonusCredits;
    if(totalAvailable < amount){
        return res.status(403).json({
            succeess: false,
            message: "Insufficient credits"
        });
    }
    //deduct from bonus credits first, then balance
    if(credit.bonusCredits >= amount){
        credit.bonusCredits -= amount;
    }else{
        const remaining = amount - credit.bonusCredits;
        credit.bonusCredits = 0;
        credit.balance -= remaining;
    }
    //updata usage 
    credit.totalCreditsUsed += amount;
    credit.totalGenerations += 1;

    if(credit.dailyLimit > 0){
        credit.dailyUsed += 1;
        if(!credit.lastDailyReset){
            credit.lastDailyReset = new Date();
        }
    }
    if(credit.monthlyLimit > 0){
      credit.monthlyLimit += 1;
      if(!credit.lastMonthlyReset){
        credit.lastMonthlyReset = new Date();
      }
    }
    await credit.save();

    res.status(200).json({
      succeess: true,
      message: "Credits deducted successfully",
      data: credit
    });
  } catch (error) {
    return res.status(400).json({
      success:false,
      message: "Error deducting credits",
      error: error.message,
    })
  }
};



//add credit to user balance 
exports.addCredits = async (req, res) => {
  try {
    const userId = req.user.id;
    const { amount, isBonus = false} = req.body;

    if(!amount || amount <= 0){
      return res.status(400).json({
        success: false,
        message: "invalid credit amount",
      });
    }
    const credit = await Credit.findOne({ user: userId});
    if(!credit){
      return res.status(404).json({
        seccess: false,
        message: "Credit record not found",
      });
    }
     if(isBonus){
      credit.bonusCredits += amount;
     } else {
      credit.balamce += amount;
     }
      await credit.save();
      res.srtatus(200).json({
        seccess: true,
        message: "Credits added successfully",
        data: credit,
      })
  } catch (error) {
    return res.srtatus(400).json({
      seccess: false,
      message: "Error adding credits",
      error: error.messasge,
    })
  }
}

//update user plan
exports.updatePlan = async (req, res) => {
  try {
    const userId = req.user.id;
    const {plan, dailyLimit, monthlyLimit, isUnlimited, subscriptionExpiresAt, subscriptionStatus, stripSbscriptionId, stripCustomerId} = req.body;

    const credit = await Credit.findOne({ user: userId});
    if(!credit){
      return res.status(404).json({
        seccess: false,
        message: "credit record not fonund",
      })
    }
    if(plan) credit.plan = plan;
    if(dailyLimit !== undefined) credit.dailyLimit = dailyLimit;
    if(monthlyLimit !== undefined) credit.monthlyLimit = monthlyLimit;
    if(isUnlimited !== undefined) credit.isUnlimited = isUnlimited;
    if(subscriptionExpiresAt) credit.subscriptionExpiresAt = subscriptionExpiresAt;
    if(subscriptionStatus) credit.subscriptionStatus = subscriptionStatus;
    if(stripSbscriptionId) credit.stripSbscriptionId = stripSbscriptionId;
    if(stripCustomerId) credit.stripCustomerId = stripCustomerId;

    //reset usage on plan change or upgrade
    credit.dailyLimit = 0;
    credit.monthlyUsed = 0;
    credit.lastMonthlyReset = new Date();
    credit.lastDailyReset = new Date();

     await credit.save();
    
     res.status(200).json({
      seccess: true,
      message: "plan updated successfully",
      data: credit,
     })
  } catch (error) {
    return res.status(400).json({
      seccess: false,
      message: "Error in updating plan",
      error: error.message,
    })
  }
}


//to cancle subscription

exports.cancelSubscription = async (req, res) => {
  try {
    const userId = req.user.id;
    const credit = await Credit.findOne({ user: userId});
    if(!credit){
      return res.status(404).json({
        success: false,
        message: "credit record or account not found",
      })
    }
    credit.subscriptionStatus = "canceled";
    credit.isUnlimited = false;

    await credit.save();
    res.status(20).json({
      success: true,
      message: "subscription cancilation successfully",
      data: credit,
    })
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: "Error in canceling subscription",
      error: error.message,
    })
  }
}

//get user statistics

exports.getUserStats = async (req, res) => {
  try {
    const userId = req.user.id;
    const credit = await Credit.findOne({user: userId});

    if(!credit){
      return res.status(404).json({
        success: false,
        message: "credit reccord or accout not foud",
      })
    }

    const stats = {
      totalCredits: credit.balamce + credit.bonusCredits,
      balance: credit.balance,
      bonusCredits: credit.bonusCredits,
      totalCreditsUsed: credit.totalCreditsUsed,
      totalGenerations: credit.totalGenerations,
      plan: credit.plan,
      dailyLimit: credit.dailyLimit,
      daiilyUsed: credit.dailyUsed,
      monthlyLimit: credit.monthlyLimit,
      monthlyUsed: credit.monthlyUsed,
      isUnlimited: credit.isUnlimited,
      subscriptionExpiresAt: credit.subscriptionExpiresAt,
      subscriptionStatus: credit.subscriptionStatus,
    };

    res.status(200).json({
      success: true,
      data: stats,
    });

  } catch (error) {
    return res.status(400).son({
      success: false,
      message: "Error fetching user statistics",
      error: error.message,
    });
  }
}

