require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000'
}));
app.use(express.json());

const americanToDecimal = (americanOdds) => {
  const odds = parseFloat(americanOdds);
  
  if (odds > 0) {
    return parseFloat((odds / 100 + 1).toFixed(2));
  } else {
    return parseFloat((100 / Math.abs(odds) + 1).toFixed(2));
  }
};

const americanToProbability = (americanOdds) => {
  const odds = parseFloat(americanOdds);
  
  if (odds > 0) {
    return parseFloat((100 / (odds + 100)).toFixed(4));
  } else {
    return parseFloat((Math.abs(odds) / (Math.abs(odds) + 100)).toFixed(4));
  }
};

// Calculate EV for a Bet (Single or Parlay)
app.post('/api/calculate-ev', (req, res) => {
  try {
    console.log("Received bet data:", JSON.stringify(req.body, null, 2));
    const { betType, stake, legs, cashoutOffer } = req.body;
    
    const numericStake = parseFloat(stake);
    const numericCashoutOffer = parseFloat(cashoutOffer);
    
    if (isNaN(numericStake) || isNaN(numericCashoutOffer)) {
      return res.status(400).json({ error: 'Stake and cashout offer must be valid numbers' });
    }
    
    const pendingLegs = legs.filter(leg => leg.status === 'Pending');
    const wonLegs = legs.filter(leg => leg.status === 'Hit / Won');
    const lostLegs = legs.filter(leg => leg.status === 'Lost');
    
    if (lostLegs.length > 0) {
      return res.json({
        expectedValue: 0,
        payoutFactor: 0,
        potentialPayout: 0,
        combinedProbability: 0,
        cashoutOffer: numericCashoutOffer,
        recommendation: "Cash out - your bet has already lost."
      });
    }
    
    let payoutFactor = 1;
    
    const allLegs = [...wonLegs, ...pendingLegs];
    console.log(`Processing ${allLegs.length} legs (${wonLegs.length} won, ${pendingLegs.length} pending)`);
    
    for (const leg of allLegs) {
      try {
        const originalOddsStr = leg.originalOdds.toString().replace(/^\+/, '');
        const originalOdds = parseFloat(originalOddsStr);
        
        if (isNaN(originalOdds)) {
          console.error(`Invalid original odds format: ${leg.originalOdds}`);
          return res.status(400).json({ error: 'Invalid odds format' });
        }
        
        const decimalOdds = americanToDecimal(originalOdds);
        console.log(`Leg: ${leg.team}, Original odds: ${originalOdds > 0 ? '+' : ''}${originalOdds}, Decimal: ${decimalOdds}`);
        
        if (betType === 'Single') {
          payoutFactor = decimalOdds;
        } else {
          // For parlay, multiply all factors
          payoutFactor *= decimalOdds;
        }
      } catch (error) {
        console.error('Error processing leg:', error);
        return res.status(400).json({ error: `Error calculating odds for leg: ${leg.team}` });
      }
    }
    
    console.log(`Final payout factor (based on original odds): ${payoutFactor}`);
    
    // Calculate potential payout if the bet wins
    const potentialPayout = parseFloat((numericStake * payoutFactor).toFixed(2));
    console.log(`Potential payout: $${potentialPayout} (stake $${numericStake} × factor ${payoutFactor})`);
    
    let combinedProbability = 1; // Start with 100% (for won legs)
    
    if (pendingLegs.length > 0) {
      const probabilities = [];
      
      for (const leg of pendingLegs) {
        const currentOddsStr = leg.currentOdds.toString().replace(/^\+/, '');
        const currentOdds = parseFloat(currentOddsStr);
        
        if (isNaN(currentOdds)) {
          console.error(`Invalid current odds format: ${leg.currentOdds}`);
          return res.status(400).json({ error: 'Invalid current odds format' });
        }
        
        const probability = americanToProbability(currentOdds);
        probabilities.push(probability);
        
        console.log(`Leg: ${leg.team}, Current odds: ${currentOdds > 0 ? '+' : ''}${currentOdds}, Probability: ${(probability * 100).toFixed(2)}%`);
      }
      
      combinedProbability = probabilities.reduce((acc, prob) => acc * prob, 1);
    }
    
    console.log(`Combined win probability: ${(combinedProbability * 100).toFixed(2)}%`);
    
    // Calculate expected value: Probability × Potential Payout - Stake
    const expectedValue = parseFloat((combinedProbability * potentialPayout - numericStake).toFixed(2));
    
    console.log(`Expected value calculation: ${combinedProbability.toFixed(4)} × $${potentialPayout} - $${numericStake} = $${expectedValue}`);
    
    // Make recommendation based on EV vs. cashout offer
    const recommendation = expectedValue > numericCashoutOffer 
      ? "Let it ride - the expected value is higher than the cashout offer."
      : "Cash out - the cashout offer is higher than the expected value.";
    
    const result = {
      expectedValue,
      payoutFactor: parseFloat(payoutFactor.toFixed(2)),
      potentialPayout,
      combinedProbability,
      cashoutOffer: numericCashoutOffer,
      recommendation
    };
    
    console.log("Sending result:", JSON.stringify(result, null, 2));
    return res.json(result);
  } catch (error) {
    console.error('Error calculating EV:', error);
    return res.status(500).json({ error: 'Failed to calculate expected value' });
  }
});

// markets
const validMarkets = [
  // Standard markets
  'h2h', 'spreads', 'totals', 'outrights', 'alternate_spreads', 'alternate_totals', 
  'btts', 'draw_no_bet', 'h2h_3_way', 'team_totals', 'alternate_team_totals',
  
  // Basketball player props
  'player_points', 'player_rebounds', 'player_assists', 'player_threes', 'player_blocks',
  'player_steals', 'player_blocks_steals', 'player_turnovers', 'player_points_rebounds_assists',
  'player_points_rebounds', 'player_points_assists', 'player_rebounds_assists',
  'player_double_double', 'player_triple_double', 'player_points_alternate',
  'player_rebounds_alternate', 'player_assists_alternate', 'player_blocks_alternate',
  'player_steals_alternate', 'player_turnovers_alternate', 'player_threes_alternate',
  'player_points_assists_alternate', 'player_points_rebounds_alternate',
  'player_rebounds_assists_alternate', 'player_points_rebounds_assists_alternate',
  
  // Baseball player props
  'batter_home_runs', 'batter_hits', 'batter_total_bases', 'batter_rbis',
  'batter_runs_scored', 'batter_hits_runs_rbis', 'batter_singles', 'batter_doubles',
  'batter_triples', 'batter_walks', 'batter_strikeouts', 'batter_stolen_bases',
  'pitcher_strikeouts', 'pitcher_record_a_win', 'pitcher_hits_allowed', 'pitcher_walks',
  'pitcher_earned_runs', 'pitcher_outs', 'batter_total_bases_alternate',
  'batter_home_runs_alternate', 'batter_hits_alternate', 'batter_rbis_alternate',
  'pitcher_hits_allowed_alternate', 'pitcher_walks_alternate', 'pitcher_strikeouts_alternate'
];

// Function to sanitize market string to array
const sanitizeMarkets = (marketsStr) => {
  if (!marketsStr) return ['h2h']; // Default to moneyline if not specified
  
  if (!marketsStr.includes(',')) {
    return validMarkets.includes(marketsStr) ? [marketsStr] : ['h2h'];
  }
  
  const marketsList = marketsStr.split(',').map(m => m.trim());
  return marketsList.filter(market => validMarkets.includes(market));
};

// Endpoint to fetch sports events from The Odds API
app.get('/api/events', async (req, res) => {
  try {
    const { sport } = req.query;
    
    if (!sport) {
      return res.status(400).json({ error: 'Sport parameter is required' });
    }
    
    const apiKey = process.env.ODDS_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'API key not configured' });
    }
    
    const response = await axios.get(`https://api.the-odds-api.com/v4/sports/${sport}/events`, {
      params: {
        apiKey,
        dateFormat: 'iso'
      }
    });
    
    // Log API usage information
    console.log(`Remaining requests: ${response.headers['x-requests-remaining']}`);
    console.log(`Used requests: ${response.headers['x-requests-used']}`);
    
    return res.json(response.data);
  } catch (error) {
    console.error('Error fetching events:', error);
    return res.status(500).json({ 
      error: 'Failed to fetch events',
      message: error.response?.data?.message || error.message
    });
  }
});

// Endpoint to fetch current odds
app.get('/api/odds', async (req, res) => {
  try {
    const { sport, markets, regions, team, bookmakers, eventId } = req.query;
    
    if (!sport) {
      return res.status(400).json({ error: 'Sport parameter is required' });
    }
    
    const apiKey = process.env.ODDS_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'API key not configured' });
    }
    
    // Sanitize and validate markets
    const sanitizedMarkets = sanitizeMarkets(markets);
    if (sanitizedMarkets.length === 0) {
      return res.status(400).json({ error: 'Invalid markets parameter' });
    }
    
    const requestParams = {
      apiKey,
      regions: regions || 'us',
      markets: sanitizedMarkets.join(','),
      oddsFormat: 'american',
      dateFormat: 'iso'
    };
    
    if (bookmakers) {
      requestParams.bookmakers = bookmakers;
    }
    
    // If an event ID is provided, we'll fetch odds for that specific event
    const endpoint = eventId 
      ? `https://api.the-odds-api.com/v4/sports/${sport}/events/${eventId}/odds`
      : `https://api.the-odds-api.com/v4/sports/${sport}/odds`;
    
    const response = await axios.get(endpoint, {
      params: requestParams
    });
    
    // Log API usage information
    console.log(`Remaining requests: ${response.headers['x-requests-remaining']}`);
    console.log(`Used requests: ${response.headers['x-requests-used']}`);
    
    if (!eventId && team) {
      const filteredOdds = [];
      const lowercaseTeam = team.toLowerCase();
      
      for (const event of response.data) {
        if (
          event.home_team.toLowerCase().includes(lowercaseTeam) || 
          event.away_team.toLowerCase().includes(lowercaseTeam) ||
          event.bookmakers.some(bm => 
            bm.markets.some(market => 
              market.outcomes.some(outcome => 
                outcome.name.toLowerCase().includes(lowercaseTeam)
              )
            )
          )
        ) {
          filteredOdds.push(event);
        }
      }
      return res.json(filteredOdds);
    }
    
    return res.json(response.data);
  } catch (error) {
    console.error('Error fetching odds:', error);
    return res.status(500).json({ 
      error: 'Failed to fetch odds',
      message: error.response?.data?.message || error.message
    });
  }
});

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 