# **Trident-G credit economy** 

## **1. Core principle**

Treat the in-app economy as a **server-side wallet in Supabase**, with redemptions applied through **Stripe discounts or customer balance**.

### **Player mental model**

**Earn Tridents and Gs in the app â†’ convert to G Credit â†’ redeem at checkout**

## **2. What credit can be used for**

G Credit can be redeemed against eligible IQMindware / Trident-G offers, such as:

- extra game packs

- premium reports

- reasoning or mindware modules

- coaching deposits

- courses

- subscriptions or renewal discounts

- selected services

## **3. Recommended currency split**

### **A. In-app earnable unit**

**Gs  
** Used for:

- rewarding progression

- variant swaps

- speed increases

- stable n-back progression

- family mastery

- transfer-readiness gains

### **B. Redeemable wallet unit**

**G Credit  
** Used for:

- monetary redemption at checkout

- discounts on products and services

- Stripe-applied reductions

This split keeps the game economy fun while making checkout clear.

## **4. Redemption rules**

Trident Credit should be:

- redeemable only on your own eligible products / services

- non-transferable

- non-withdrawable

- non-refundable as cash

- capped per basket or per month

- controlled entirely by the backend

Example cap rules:

- maximum **50% of a one-off order**

- maximum **20â€“30% of a coaching course deposit**

- subscriptions can use customer balance rather than instant coupons

## **5. Redemption modes**

### **One-off purchases**

Use a **dynamic amount-off Stripe coupon**

Best for:

- packs

- premium reports

- courses

- coaching deposits

- add-ons

Flow:

1.  user selects product

2.  user chooses to use Trident Credit

3.  backend validates eligibility and cap

4.  backend reserves the credit in Supabase

5.  backend creates Stripe coupon

6.  backend creates Checkout Session with that coupon

7.  Stripe shows instant reduced price

8.  webhook finalises redemption

### **Subscription or renewal credit**

Use **Stripe customer balance**

Best for:

- subscription renewals

- future invoice discounts

Flow:

1.  user earns G Credit

2.  backend writes credit to Stripe customer balance

3.  next invoice automatically uses it

### **Marketing / referral offers**

Use **promotion codes**

Best for:

- referral rewards

- founder offers

- campaigns

- partner incentives

## **6. Supabase as source of truth**

### **Tables**

**credit_accounts**

- user_id

- available_G

- reserved_G

- lifetime_earned_G

**credit_ledger**

- id

- user_id

- type = earn \| reserve \| redeem \| release \| expire \| manual_adjustment \| convert

- amount_G

- reference

- created_at

You may also want:  
**G_balances**

- user_id

- available_G

- lifetime_earned_G

This lets you keep:

- the game currency

- the sterling-linked redeemable wallet

separate and tidy.

## **7. Instant redemption flow**

### **A. User earns G**

Awarded for validated in-app actions such as:

- stable progression

- successful same-family swaps

- speed progression

- family mastery

- transfer-readiness gains

### **B. Tridents convert into Trident Credit**

You can do this either:

- automatically

- or by a â€œConvertâ€ action

I would recommend **automatic conversion** in the backend for simplicity.

### **C. User clicks â€œUse my creditâ€**

Client sends:

- product / price ID

- requested amount of Trident Credit

### **D. Backend validates and reserves**

Server checks:

- user is authenticated

- product is eligible

- enough available credit exists

- redemption cap rules pass

Then:

- move requested amount from available_pence to reserved_pence

### **E. Backend creates Stripe discount**

For one-off checkout:

- create Stripe coupon with amount_off

- attach coupon to Checkout Session

For subscription:

- create customer balance adjustment

### **F. Store linkage**

Save:

- user_id

- reserved amount

- Stripe coupon or balance transaction ID

- Checkout Session ID

- status = pending

### **G. Webhook finalises**

On successful completion:

- mark reserved credit as redeemed

If checkout fails / expires / is cancelled:

- release reserved credit back to available

## **8. What to avoid**

Do not:

- treat the client as source of truth

- decrement balances before Stripe confirms

- pre-mint reusable coupons client-side

- let multiple discount systems stack freely

- make the wallet look like cash or crypto

## **9. Best user-facing copy**

### **Simple economy explanation**

**Earn G by building stable performance and portable gains.  
Your G convert into G Credit, which you can use on selected packs, reports, coaching, and courses.**

### **Checkout copy**

**Use G Credit  
** Apply your earned balance as an instant discount on eligible offers.

### **Wallet copy**

**G earned:** 1.2  
G **Credit available:** \$12.00

Yes â€” here is the **cleaned-up payout spec again**, now using the new terminology:

- **Tridents** = the base in-app currency

- **Gs** = the higher-level display unit

- **1 G = 1,000 Tridents**

- **10 Gs = 10,000 Tridents = \$100**

**â€œGâ€ is being used loosely here as a like a standardised general intelligence point** (although not as a formal psychometric claim)

## **Trident-G Capacity Gym payout spec** 

### **Core economy language**

- **Tridents** = the earnable micro-currency

- **Gs** = the player-facing macro currency unit

- **1,000 Tridents = 1 G**

- **10,000 Tridents = 10 Gs**

### **Core reward target**

If a user completes **all current variants** to **stable 3-back at fast speed within 20 sessions**, they receive:

- **10 Gs total earned**

- **\$100 Trident Credit**

- **1 free coaching session voucher**

### **Display logic**

For the user, you can show both:

- **Tridents earned this session**

- **Total G balance**

Example:

- **+240 Tridents**

- **Total balance: 3.8 Gs**

That is much better than forcing users to think only in tens of thousands of Tridents.

# **1. Economy constants**

**î°ƒ**export const ECONOMY = {

TRIDENTS_PER_G: 1000,

GS_TARGET: 10,

TARGET_TRIDENTS: 10_000,

TARGET_CREDIT_USD: 100,

CHALLENGE_SESSION_LIMIT: 20,

CURRENT_FAMILY_COUNT: 3,

CURRENT_VARIANT_COUNT: 9,

COACHING_SESSION_USD: 100,

FREE_COACHING_VOUCHER_ON_CHALLENGE: true,

};

î°‚

# **2. Reward buckets**

## **Recommended allocation**

- **2 Gs** = session quality and local progress

- **4.5 Gs** = portability and mastery

- **1.5 Gs** = transfer-readiness milestones

- **2 Gs** = final challenge completion bonus

î°ƒexport const REWARD_BUCKETS = {

SESSION_QUALITY_MAX_TRIDENTS: 2_000, // 2.0 G

PORTABILITY_MASTERY_MAX_TRIDENTS: 4_500, // 4.5 G

TRANSFER_READINESS_MAX_TRIDENTS: 1_500, // 1.5 G

CHALLENGE_BONUS_MAX_TRIDENTS: 2_000, // 2.0 G

};

î°‚Total:

- **10,000 Tridents**

- **10 Gs**

- **\$100 Trident Credit**

# **3. Session quality bucket**

This is the **thin-automation / stable effort** bucket. It matters, but it should stay the smallest.

î°ƒexport const SESSION_EVENTS = {

SESSION_GOOD: {

tridents: 40, // 0.04 G

maxAwardsPerUser: 20,

},

SESSION_FAST_FINISH: {

tridents: 20, // 0.02 G

maxAwardsPerUser: 20,

},

SESSION_PERSONAL_BEST_AVG: {

tridents: 40, // 0.04 G

maxAwardsPerUser: 10,

},

SESSION_PERSONAL_BEST_STABLE: {

tridents: 40, // 0.04 G

maxAwardsPerUser: 10,

},

};

### î°‚**Bucket max**

- **2,000 Tridents**

- **2.0 Gs**

# **4. Portability and mastery bucket**

This is the **main reward bucket**.

î°ƒexport const PORTABILITY_EVENTS = {

SAME_FAMILY_SWAP_HOLD: {

tridents: 100, // 0.10 G

maxAwardsPerUser: 9,

},

VARIANT_FAST_3_MASTERED: {

tridents: 200, // 0.20 G

maxAwardsPerUser: 9,

},

FAMILY_FAST_3_MASTERED: {

tridents: 600, // 0.60 G

maxAwardsPerUser: 3,

},

};

### î°‚**Meaning**

- **Swap hold** = the player kept performance stable after a same-family wrapper swap

- **Variant fast 3 mastered** = that variant is completed to stable 3-back at fast speed

- **Family fast 3 mastered** = all variants in that family are completed to stable 3-back at fast speed

### **Bucket max**

- 9 swap holds Ã— 100 = **900 Tridents**

- 9 variants Ã— 200 = **1,800 Tridents**

- 3 families Ã— 600 = **1,800 Tridents**

Total:

- **4,500 Tridents**

- **4.5 Gs**

# **5. Transfer Readiness bucket**

This is the **carry-over / broader generalisation proxy** bucket.

î°ƒexport const TRANSFER_READINESS_EVENTS = {

TRANSFER_READINESS_EMERGING: {

tridents: 150, // 0.15 G

maxAwardsPerUser: 1,

},

TRANSFER_READINESS_DEVELOPING: {

tridents: 300, // 0.30 G

maxAwardsPerUser: 1,

},

TRANSFER_READINESS_BROADENING: {

tridents: 450, // 0.45 G

maxAwardsPerUser: 1,

},

TRANSFER_READINESS_STRONG: {

tridents: 600, // 0.60 G

maxAwardsPerUser: 1,

},

};

### î°‚**Bucket max**

- **1,500 Tridents**

- **1.5 Gs**

# **6. Final challenge bonus**

**î°ƒ**export const CHALLENGE_EVENTS = {

CAPACITY_GYM_CHALLENGE_20_COMPLETED: {

tridents: 2_000, // 2.0 G

maxAwardsPerUser: 1,

},

FREE_COACHING_SESSION_VOUCHER: {

tridents: 0,

maxAwardsPerUser: 1,

},

};

### î°‚**Meaning**

The player has:

- completed all current variants

- to stable 3-back

- at fast speed

- within 20 sessions

### **Reward**

- **2,000 Tridents**

- **2.0 Gs**

- **1 free coaching session voucher**

# **7. Total reward path**

**î°ƒ**2,000 // session quality = 2.0 G

4,500 // portability/mastery = 4.5 G

1,500 // transfer readiness = 1.5 G

2,000 // challenge bonus = 2.0 G

------

10,000 // total = 10.0 G

î°‚And:

- **10 Gs = \$100 Trident Credit**

- **+ 1 free coaching session voucher**

# **8. Event names**

**î°ƒ**SESSION_GOOD

SESSION_FAST_FINISH

SESSION_PERSONAL_BEST_AVG

SESSION_PERSONAL_BEST_STABLE

SAME_FAMILY_SWAP_HOLD

VARIANT_FAST_3_MASTERED

FAMILY_FAST_3_MASTERED

TRANSFER_READINESS_EMERGING

TRANSFER_READINESS_DEVELOPING

TRANSFER_READINESS_BROADENING

TRANSFER_READINESS_STRONG

CAPACITY_GYM_CHALLENGE_20_COMPLETED

FREE_COACHING_SESSION_VOUCHER_ISSUED

î°‚

# **9. Player-facing feedback copy**

## **Wallet / reward copy**

- **Tridents earned this session:** 240

- **Total balance:** 3.8 Gs

- **Equivalent Trident Credit:** \$38

## **Session reward feed examples**

- **+40 Tridents** â€” Good session

- **+20 Tridents** â€” Fast finish

- **+40 Tridents** â€” New best average

- **+100 Tridents** â€” Carry-over detected after wrapper swap

- **+200 Tridents** â€” Variant mastered at fast 3-back

- **+600 Tridents** â€” Family mastered at fast 3-back

- **+450 Tridents** â€” Transfer Readiness advanced to Broadening

- **+2,000 Tridents** â€” 20-session challenge completed

## **Macro summary copy**

- **You earned 0.24 G today**

- **Your total is now 3.8 Gs**

- **2.2 Gs to go until the 10 G challenge reward**

# **10. Suggested UI terminology**

## **Best display pattern**

I would use:

- **Tridents** for granular rewards

- **Gs** for wallet totals and milestone progress

So:

- session feed = Tridents

- dashboard total = Gs

- checkout value = Trident Credit / USD equivalent

### **Example**

- **This session:** +180 Tridents

- **Wallet:** 4.2 Gs

- **Redeemable credit:** \$42 Trident Credit

That is much cleaner than showing:

- 4,200 Tridents everywhere

# **11. Suggested explanatory copy**

## **Short version**

**Tridents are the base reward you earn in the Capacity Gym.  
Every 1,000 Tridents converts to 1 G.  
Gs track your broader progress toward redeemable Trident Credit and milestone rewards.**

## **Longer version**

**Tridents reward stable performance, carry-over across wrapper changes, and progress toward broader generalisation.  
Gs are the higher-level progress unit: 1 G equals 1,000 Tridents.  
Reach 10 Gs by completing the Capacity Gym challenge to unlock \$100 Trident Credit, and complete it within 20 sessions to earn a free coaching session too.**

# **12. Recommended terminology for redemption**

To keep this clean:

- **Tridents** = earnable unit

- **Gs** = progress / milestone unit

- **Trident Credit** = redeemable store value

- **Coaching voucher** = separate service reward

So you do **not** say:

- â€œSpend your Gs directlyâ€

You say:

- **Your G balance converts into Trident Credit**

- **Trident Credit can be redeemed on eligible packs, courses, coaching deposits, and services**

# **13. My recommendation on the coin design text**

Given the coin mock-up, I would probably avoid putting **â€œ1 G CREDITâ€** on the face if the coin is really meant to signify the whole system, because that locks the artwork to one denomination.

A cleaner structure would be:

### **Front**

- **Trident G**

- or **1 G**

- or simply the **trident symbol**

### **Back**

- denomination or flavour text if needed

For example:

- **1 G**

- **1000 Tridents**

- **Trident Credit**

If you want the coin itself to represent the **exchange unit**, then:

- **1 G = 1000 Tridents**

is a strong denomination line.

If you want it to represent the **brand currency more generally**, then I would keep the face simpler and let the app UI handle the exact conversion.

# **14. Summary**

**Tridents are the micro-rewards, Gs are the macro progress unit, and 10 Gs = 10,000 Tridents = \$100 Trident Credit, with a free coaching session added for full challenge completion within 20 sessions.**

