import React, { useState } from 'react';
import {
  Box,
  Button,
  FormControl,
  FormControlLabel,
  Grid,
  InputAdornment,
  MenuItem,
  Radio,
  RadioGroup,
  TextField,
  Typography,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Card,
  CardContent,
  Divider,
  Chip,
  Tabs,
  Tab,
  Avatar,
  Tooltip,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import SportsIcon from '@mui/icons-material/Sports';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import SportsSoccerIcon from '@mui/icons-material/SportsSoccer';
import SportsBasketballIcon from '@mui/icons-material/SportsBasketball';
import SportsFootballIcon from '@mui/icons-material/SportsFootball';
import SportsBaseballIcon from '@mui/icons-material/SportsBaseball';
import SportsHockeyIcon from '@mui/icons-material/SportsHockey';
import PersonIcon from '@mui/icons-material/Person';
import CalculateIcon from '@mui/icons-material/Calculate';

const initialLeg = {
  team: '',
  originalOdds: '',
  currentOdds: '',
  status: 'Pending'
};

// Format American odds with + sign
const formatOdds = (odds) => {
  if (!odds) return '';
  
  const numOdds = parseInt(odds);
  return numOdds > 0 ? `+${numOdds}` : `${numOdds}`;
};

const BettingForm = ({ onSubmit, fetchOdds, fetchEvents, loading }) => {
  const [formData, setFormData] = useState({
    betType: 'Single',
    stake: '',
    legs: [{ ...initialLeg }],
    cashoutOffer: ''
  });

  const [oddsDialogOpen, setOddsDialogOpen] = useState(false);
  const [currentLegIndex, setCurrentLegIndex] = useState(0);
  const [oddsParams, setOddsParams] = useState({
    sport: 'americanfootball_nfl',
    markets: 'h2h',
    team: ''
  });
  const [fetchingOdds, setFetchingOdds] = useState(false);
  const [fetchedEvents, setFetchedEvents] = useState([]);
  const [fetchedPlayerProps, setFetchedPlayerProps] = useState([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [activeTab, setActiveTab] = useState(0);
  const [expandedEvent, setExpandedEvent] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [selectedPlayerMarket, setSelectedPlayerMarket] = useState('player_points');
  const [playersMap, setPlayersMap] = useState({});
  const [selectedPlayer, setSelectedPlayer] = useState(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // For numeric fields, ensure we have valid values
    if (name === 'stake' || name === 'cashoutOffer') {
      // Ensure it's a valid number
      if (value && isNaN(parseFloat(value))) {
        return; // Don't update if it's not a valid number
      }
    }
    
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleLegChange = (index, field, value) => {
    const updatedLegs = [...formData.legs];
    
    // For odds fields, ensure we have valid numeric values
    if (field === 'originalOdds' || field === 'currentOdds') {
      // Remove any + sign for storage (but we'll display it)
      value = value.toString().replace(/^\+/, '');
      
      // Ensure it's a valid number
      if (value && isNaN(parseInt(value))) {
        return; // Don't update if it's not a valid number
      }
    }
    
    updatedLegs[index] = { ...updatedLegs[index], [field]: value };
    
    // If original odds are set and current odds are not, set current = original
    if (field === 'originalOdds' && !updatedLegs[index].currentOdds) {
      updatedLegs[index].currentOdds = value;
    }
    
    setFormData(prev => ({ ...prev, legs: updatedLegs }));
  };

  const addLeg = () => {
    setFormData(prev => ({
      ...prev,
      betType: 'Parlay', // Automatically switch to parlay if adding legs
      legs: [...prev.legs, { ...initialLeg }]
    }));
  };

  const removeLeg = (index) => {
    const updatedLegs = [...formData.legs];
    updatedLegs.splice(index, 1);
    
    setFormData(prev => ({
      ...prev,
      legs: updatedLegs
    }));
    
    // If only one leg is left, switch back to single bet type
    if (updatedLegs.length === 1) {
      setFormData(prev => ({ ...prev, betType: 'Single' }));
    }
  };

  const openOddsDialog = (index) => {
    setCurrentLegIndex(index);
    setOddsParams({
      sport: 'americanfootball_nfl',
      markets: 'h2h',
      team: formData.legs[index].team
    });
    setFetchedEvents([]);
    setFetchedPlayerProps([]);
    setSelectedEvent(null);
    setSelectedPlayerMarket('player_points');
    setErrorMessage('');
    setActiveTab(0);
    setOddsDialogOpen(true);
  };

  const handleOddsParamsChange = (e) => {
    const { name, value } = e.target;
    setOddsParams(prev => ({ ...prev, [name]: value }));
  };

  const fetchCurrentOdds = async () => {
    setFetchingOdds(true);
    setErrorMessage('');
    try {
      if (activeTab === 0) {
        // Fetch regular odds
        const events = await fetchOdds(oddsParams);
        setFetchedEvents(events);
        if (events.length === 0) {
          setErrorMessage('No events found for the specified parameters.');
        }
      } else if (activeTab === 1) {
        // For player props, first fetch available events
        const events = await fetchEvents({ sport: oddsParams.sport });
        setFetchedEvents(events);
        if (events.length === 0) {
          setErrorMessage('No events found for the specified sport.');
        }
      }
    } catch (error) {
      setErrorMessage(error.message || 'Failed to fetch odds. Please try again.');
    } finally {
      setFetchingOdds(false);
    }
  };

  const fetchPlayerProps = async (eventId) => {
    setFetchingOdds(true);
    setErrorMessage('');
    setSelectedPlayer(null);
    setSelectedEvent(eventId);
    
    try {
      const playerPropsParams = {
        sport: oddsParams.sport,
        eventId: eventId,
        markets: selectedPlayerMarket
      };
      
      const response = await fetchOdds(playerPropsParams);
      
      // The response is a single event with bookmakers
      if (response && typeof response === 'object') {
        setFetchedPlayerProps([response]);
        
        // Extract players from the response
        const playerData = {};
        
        // Go through each bookmaker
        if (response.bookmakers && response.bookmakers.length > 0) {
          response.bookmakers.forEach(bookmaker => {
            if (bookmaker.markets && bookmaker.markets.length > 0) {
              bookmaker.markets.forEach(market => {
                if (market.key === selectedPlayerMarket && market.outcomes) {
                  market.outcomes.forEach(outcome => {
                    // The player name is in the description field
                    const playerName = outcome.description;
                    
                    if (!playerData[playerName]) {
                      playerData[playerName] = [];
                    }
                    
                    playerData[playerName].push({
                      bookmaker: bookmaker.title,
                      bookmakerId: bookmaker.key,
                      market: market.key,
                      name: outcome.name,
                      point: outcome.point,
                      price: outcome.price
                    });
                  });
                }
              });
            }
          });
          
          setPlayersMap(playerData);
          
          if (Object.keys(playerData).length === 0) {
            setErrorMessage('No player props found for this event and market.');
          }
        } else {
          setErrorMessage('No bookmakers available for this event.');
        }
      } else {
        setErrorMessage('Invalid response format from the API.');
      }
    } catch (error) {
      console.error('Error fetching player props:', error);
      setErrorMessage(error.message || 'Failed to fetch player props. Please try again.');
    } finally {
      setFetchingOdds(false);
    }
  };

  const handlePlayerMarketChange = (e) => {
    setSelectedPlayerMarket(e.target.value);
    if (selectedEvent) {
      fetchPlayerProps(selectedEvent);
    }
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
    setFetchedEvents([]);
    setFetchedPlayerProps([]);
    setSelectedEvent(null);
    setErrorMessage('');
  };

  const selectOdds = (bookmaker, marketKey, outcome) => {
    // Update the leg with the selected odds
    const updatedLegs = [...formData.legs];
    updatedLegs[currentLegIndex] = {
      ...updatedLegs[currentLegIndex],
      currentOdds: outcome.price,
      team: `${outcome.name} (${marketKey === 'h2h' ? 'ML' : marketKey})`
    };
    
    setFormData(prev => ({ ...prev, legs: updatedLegs }));
    setOddsDialogOpen(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.stake || formData.stake <= 0) {
      setErrorMessage('Please enter a valid stake amount.');
      return;
    }
    
    if (!formData.cashoutOffer || formData.cashoutOffer <= 0) {
      setErrorMessage('Please enter a valid cashout offer amount.');
      return;
    }
    
    for (const leg of formData.legs) {
      if (!leg.team) {
        setErrorMessage('Please enter a team/side for all legs.');
        return;
      }
      
      if (!leg.originalOdds) {
        setErrorMessage('Please enter original odds for all legs.');
        return;
      }
      
      if (leg.status === 'Pending' && !leg.currentOdds) {
        setErrorMessage('Please enter current odds for all pending legs.');
        return;
      }
    }
    
    setErrorMessage('');
    onSubmit(formData);
  };

  const handleAccordionChange = (eventId) => (event, isExpanded) => {
    setExpandedEvent(isExpanded ? eventId : null);
  };

  const getSportIcon = (sport) => {
    if (sport.includes('football')) return <SportsFootballIcon />;
    if (sport.includes('basketball')) return <SportsBasketballIcon />;
    if (sport.includes('baseball')) return <SportsBaseballIcon />;
    if (sport.includes('hockey')) return <SportsHockeyIcon />;
    if (sport.includes('soccer')) return <SportsSoccerIcon />;
    return <SportsIcon />;
  };
  
  // Sport options with icons
  const sportOptions = [
    { value: 'americanfootball_nfl', label: 'NFL', icon: <SportsFootballIcon /> },
    { value: 'americanfootball_ncaaf', label: 'NCAAF', icon: <SportsFootballIcon /> },
    { value: 'baseball_mlb', label: 'MLB', icon: <SportsBaseballIcon /> },
    { value: 'basketball_nba', label: 'NBA', icon: <SportsBasketballIcon /> },
    { value: 'basketball_ncaab', label: 'NCAAB', icon: <SportsBasketballIcon /> },
    { value: 'icehockey_nhl', label: 'NHL', icon: <SportsHockeyIcon /> },
    { value: 'soccer_epl', label: 'EPL', icon: <SportsSoccerIcon /> },
    { value: 'soccer_usa_mls', label: 'MLS', icon: <SportsSoccerIcon /> }
  ];

  // Market options by category
  const marketOptions = {
    standard: [
      { value: 'h2h', label: 'Moneyline' },
      { value: 'spreads', label: 'Spreads' },
      { value: 'totals', label: 'Totals (Over/Under)' },
      { value: 'alternate_spreads', label: 'Alternate Spreads' },
      { value: 'alternate_totals', label: 'Alternate Totals' },
      { value: 'team_totals', label: 'Team Totals' },
      { value: 'alternate_team_totals', label: 'Alternate Team Totals' },
      { value: 'outrights', label: 'Outrights' },
      { value: 'h2h_3_way', label: '3-Way Moneyline' },
      { value: 'btts', label: 'Both Teams to Score' },
      { value: 'draw_no_bet', label: 'Draw No Bet' }
    ],
    basketball: [
      { value: 'player_points', label: 'Player Points' },
      { value: 'player_rebounds', label: 'Player Rebounds' },
      { value: 'player_assists', label: 'Player Assists' },
      { value: 'player_threes', label: 'Player Threes' },
      { value: 'player_blocks', label: 'Player Blocks' },
      { value: 'player_steals', label: 'Player Steals' },
      { value: 'player_points_rebounds_assists', label: 'Player PRA' },
      { value: 'player_double_double', label: 'Double Double' },
      { value: 'player_triple_double', label: 'Triple Double' }
    ],
    baseball: [
      { value: 'batter_home_runs', label: 'Batter HRs' },
      { value: 'batter_hits', label: 'Batter Hits' },
      { value: 'batter_total_bases', label: 'Batter Total Bases' },
      { value: 'batter_rbis', label: 'Batter RBIs' },
      { value: 'batter_runs_scored', label: 'Batter Runs' },
      { value: 'pitcher_strikeouts', label: 'Pitcher Strikeouts' },
      { value: 'pitcher_record_a_win', label: 'Pitcher Win' }
    ]
  };

  // Function to get available markets based on selected sport
  const getAvailableMarkets = () => {
    const availableMarkets = [...marketOptions.standard];
    
    if (oddsParams.sport.includes('basketball')) {
      availableMarkets.push(...marketOptions.basketball);
    }
    
    if (oddsParams.sport.includes('baseball')) {
      availableMarkets.push(...marketOptions.baseball);
    }
    
    return availableMarkets;
  };

  // Handle player selection
  const handlePlayerSelect = (playerName) => {
    setSelectedPlayer(playerName);
  };

  // Select player prop odds
  const selectPlayerOdds = (bookmakerKey, market, playerName, outcome) => {
    // Format the team name for player props - include the line
    let propDescription = `${playerName} ${outcome.name}`;
    
    // Add the point/line if available
    if (outcome.point !== undefined) {
      propDescription += ` ${outcome.point}`;
    }
    
    // Add market type
    propDescription += ` (${market.replace('player_', '')})`;
    
    // Update the leg with the selected player prop odds
    const updatedLegs = [...formData.legs];
    updatedLegs[currentLegIndex] = {
      ...updatedLegs[currentLegIndex],
      currentOdds: outcome.price,
      team: propDescription,
      // Also set original odds if not yet set
      originalOdds: !updatedLegs[currentLegIndex].originalOdds ? outcome.price : updatedLegs[currentLegIndex].originalOdds
    };
    
    setFormData(prev => ({ ...prev, legs: updatedLegs }));
    setOddsDialogOpen(false);
  };

  // Format player line for display
  const formatPlayerLine = (point) => {
    if (point === undefined) return '';
    return `${point >= 0 ? '+' : ''}${point}`;
  };

  // Reset player selection when going back to games
  const resetPlayerSelection = () => {
    setSelectedEvent(null);
    setFetchedPlayerProps([]);
    setPlayersMap({});
    setSelectedPlayer(null);
  };

  return (
    <Box component="form" onSubmit={handleSubmit} noValidate>
      <Typography variant="h5" gutterBottom sx={{ color: 'primary.main', fontWeight: 'bold' }}>
        Bet Details
      </Typography>
      
      <Card variant="outlined" sx={{ mb: 4 }}>
        <CardContent>
          <Grid container spacing={3}>
            {/* Bet Type */}
            <Grid item xs={12} sm={6}>
              <FormControl component="fieldset">
                <Typography variant="subtitle1" gutterBottom>
                  Bet Type
                </Typography>
                <RadioGroup
                  row
                  name="betType"
                  value={formData.betType}
                  onChange={handleInputChange}
                >
                  <FormControlLabel 
                    value="Single" 
                    control={<Radio color="secondary" />} 
                    label="Single" 
                    disabled={formData.legs.length > 1}
                  />
                  <FormControlLabel 
                    value="Parlay" 
                    control={<Radio color="secondary" />} 
                    label="Parlay" 
                  />
                </RadioGroup>
              </FormControl>
            </Grid>
            
            {/* Stake */}
            <Grid item xs={12} sm={6}>
              <TextField
                required
                label="Stake"
                name="stake"
                value={formData.stake}
                onChange={handleInputChange}
                fullWidth
                type="number"
                InputProps={{
                  startAdornment: <InputAdornment position="start">$</InputAdornment>,
                  inputProps: { min: 0, step: 0.01 }
                }}
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>
      
      <Typography variant="h6" sx={{ mt: 4, mb: 2, color: 'primary.dark', fontWeight: 'bold' }}>
        Bet Legs
      </Typography>
      
      {formData.legs.map((leg, index) => (
        <Card 
          key={index} 
          variant="outlined" 
          sx={{ 
            mb: 3, 
            borderColor: leg.status === 'Hit / Won' ? 'success.light' : 
                        leg.status === 'Lost' ? 'error.light' : 'primary.light'
          }}
        >
          <CardContent>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12}>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                    Leg {index + 1}
                    {leg.status === 'Hit / Won' && (
                      <Chip 
                        label="Won" 
                        color="success" 
                        size="small" 
                        sx={{ ml: 1 }} 
                      />
                    )}
                    {leg.status === 'Lost' && (
                      <Chip 
                        label="Lost" 
                        color="error" 
                        size="small" 
                        sx={{ ml: 1 }} 
                      />
                    )}
                    {leg.status === 'Pending' && (
                      <Chip 
                        label="Pending" 
                        color="primary" 
                        size="small" 
                        sx={{ ml: 1 }} 
                      />
                    )}
                  </Typography>
                  {formData.legs.length > 1 && (
                    <IconButton 
                      size="small" 
                      onClick={() => removeLeg(index)}
                      color="error"
                    >
                      <DeleteIcon />
                    </IconButton>
                  )}
                </Box>
              </Grid>
              
              {/* Team */}
              <Grid item xs={12} sm={6}>
                <TextField
                  required
                  label="Team / Selection"
                  value={leg.team}
                  onChange={(e) => handleLegChange(index, 'team', e.target.value)}
                  fullWidth
                />
              </Grid>
              
              {/* Status */}
              <Grid item xs={12} sm={6}>
                <TextField
                  select
                  label="Status"
                  value={leg.status}
                  onChange={(e) => handleLegChange(index, 'status', e.target.value)}
                  fullWidth
                >
                  <MenuItem value="Pending">Pending</MenuItem>
                  <MenuItem value="Hit / Won">Hit / Won</MenuItem>
                  <MenuItem value="Lost">Lost</MenuItem>
                </TextField>
              </Grid>
              
              {/* Original Odds */}
              <Grid item xs={12} sm={6}>
                <TextField
                  required
                  label="Original Odds"
                  value={leg.originalOdds}
                  onChange={(e) => handleLegChange(index, 'originalOdds', e.target.value)}
                  InputProps={{
                    startAdornment: leg.originalOdds && parseInt(leg.originalOdds) > 0 ? 
                      <InputAdornment position="start">+</InputAdornment> : null,
                    inputProps: { step: 1 }
                  }}
                  fullWidth
                  type="number"
                  helperText="Enter in American format (e.g. +200, -150)"
                />
              </Grid>
              
              {/* Current Odds (only for pending legs) */}
              {leg.status === 'Pending' && (
                <Grid item xs={12} sm={6}>
                  <TextField
                    required
                    label="Current Odds"
                    value={leg.currentOdds}
                    onChange={(e) => handleLegChange(index, 'currentOdds', e.target.value)}
                    InputProps={{
                      startAdornment: leg.currentOdds && parseInt(leg.currentOdds) > 0 ? 
                        <InputAdornment position="start">+</InputAdornment> : null,
                      endAdornment: (
                        <InputAdornment position="end">
                          <Tooltip title="Fetch current odds">
                            <IconButton 
                              onClick={() => openOddsDialog(index)}
                              edge="end"
                              color="primary"
                            >
                              <SportsIcon />
                            </IconButton>
                          </Tooltip>
                        </InputAdornment>
                      ),
                      inputProps: { step: 1 }
                    }}
                    fullWidth
                    type="number"
                    helperText="Enter manually or fetch from The Odds API"
                  />
                </Grid>
              )}
            </Grid>
          </CardContent>
        </Card>
      ))}
      
      <Button
        startIcon={<AddIcon />}
        onClick={addLeg}
        sx={{ mb: 3 }}
        variant="outlined"
        color="secondary"
      >
        Add Leg
      </Button>
      
      <Typography variant="h6" gutterBottom sx={{ mt: 4, color: 'primary.dark', fontWeight: 'bold' }}>
        Cashout Details
      </Typography>
      
      <Card variant="outlined" sx={{ mb: 4 }}>
        <CardContent>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <TextField
                required
                label="Cashout Offer"
                name="cashoutOffer"
                value={formData.cashoutOffer}
                onChange={handleInputChange}
                fullWidth
                type="number"
                InputProps={{
                  startAdornment: <InputAdornment position="start">$</InputAdornment>,
                  inputProps: { min: 0, step: 0.01 }
                }}
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>
      
      {errorMessage && (
        <Typography color="error" sx={{ mt: 2, mb: 2, p: 2, bgcolor: '#ffebee', borderRadius: 1 }}>
          {errorMessage}
        </Typography>
      )}
      
      <Button
        type="submit"
        variant="contained"
        color="primary"
        size="large"
        sx={{ mt: 2, px: 4, py: 1 }}
        disabled={loading}
        startIcon={<CalculateIcon />}
      >
        {loading ? <CircularProgress size={24} /> : 'Calculate EV'}
      </Button>
      
      {/* Odds API Dialog */}
      <Dialog 
        open={oddsDialogOpen} 
        onClose={() => setOddsDialogOpen(false)} 
        maxWidth="lg" 
        fullWidth
        PaperProps={{
          sx: { borderRadius: 2 }
        }}
      >
        <DialogTitle sx={{ pb: 1, pt: 2, fontWeight: 'bold' }}>
          <Box display="flex" alignItems="center">
            {getSportIcon(oddsParams.sport)}
            <Typography variant="h6" sx={{ ml: 1 }}>
              Fetch Current Odds
            </Typography>
          </Box>
        </DialogTitle>
        <Divider />
        <DialogContent>
          <Tabs 
            value={activeTab}
            onChange={handleTabChange}
            variant="scrollable"
            scrollButtons="auto"
            sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}
          >
            <Tab icon={<SportsIcon />} label="Game Odds" />
            <Tab 
              icon={<PersonIcon />} 
              label="Player Props" 
              disabled={!['basketball_nba', 'basketball_ncaab', 'baseball_mlb'].includes(oddsParams.sport)} 
            />
          </Tabs>
          
          <Box hidden={activeTab !== 0}>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={4}>
                <TextField
                  select
                  label="Sport"
                  name="sport"
                  value={oddsParams.sport}
                  onChange={handleOddsParamsChange}
                  fullWidth
                  SelectProps={{
                    renderValue: (value) => {
                      const option = sportOptions.find(opt => opt.value === value);
                      return (
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Avatar sx={{ width: 24, height: 24, mr: 1, bgcolor: 'primary.main' }}>
                            {option?.icon}
                          </Avatar>
                          {option?.label}
                        </Box>
                      );
                    }
                  }}
                >
                  {sportOptions.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Avatar sx={{ width: 24, height: 24, mr: 1, bgcolor: 'primary.main' }}>
                          {option.icon}
                        </Avatar>
                        {option.label}
                      </Box>
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              
              <Grid item xs={12} sm={4}>
                <TextField
                  select
                  label="Market"
                  name="markets"
                  value={oddsParams.markets}
                  onChange={handleOddsParamsChange}
                  fullWidth
                >
                  {getAvailableMarkets().filter(market => !market.value.includes('player_')).map((market) => (
                    <MenuItem key={market.value} value={market.value}>
                      {market.label}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              
              <Grid item xs={12} sm={4}>
                <TextField
                  label="Team (Optional)"
                  name="team"
                  value={oddsParams.team}
                  onChange={handleOddsParamsChange}
                  fullWidth
                  helperText="Leave blank to see all events"
                />
              </Grid>
            </Grid>
            
            <Button
              variant="contained"
              onClick={fetchCurrentOdds}
              disabled={fetchingOdds}
              color="secondary"
              sx={{ mt: 3 }}
            >
              {fetchingOdds ? <CircularProgress size={24} /> : 'Fetch Odds'}
            </Button>
            
            {errorMessage && (
              <Typography color="error" sx={{ mt: 2 }}>
                {errorMessage}
              </Typography>
            )}
            
            {fetchedEvents.length > 0 && (
              <Box sx={{ mt: 4 }}>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', color: 'primary.dark' }}>
                  Available Events ({fetchedEvents.length})
                </Typography>
                
                {fetchedEvents.map((event, eventIndex) => (
                  <Accordion 
                    key={eventIndex} 
                    expanded={expandedEvent === eventIndex}
                    onChange={handleAccordionChange(eventIndex)}
                    sx={{ mb: 2, boxShadow: 'none', border: '1px solid', borderColor: 'divider' }}
                  >
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                      <Grid container alignItems="center">
                        <Grid item xs={8}>
                          <Typography variant="subtitle1" sx={{ fontWeight: 'medium' }}>
                            {event.home_team} vs {event.away_team}
                          </Typography>
                        </Grid>
                        <Grid item xs={4}>
                          <Typography variant="body2" color="text.secondary">
                            {new Date(event.commence_time).toLocaleString()}
                          </Typography>
                        </Grid>
                      </Grid>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Divider sx={{ mb: 2 }} />
                      
                      {event.bookmakers && event.bookmakers.map((bookmaker, bookmakerIndex) => (
                        <Box key={bookmakerIndex} sx={{ mb: 3 }}>
                          <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>
                            {bookmaker.title}
                          </Typography>
                          
                          {bookmaker.markets && bookmaker.markets.map((market, marketIndex) => (
                            <Card key={marketIndex} variant="outlined" sx={{ mb: 2, borderColor: 'primary.light' }}>
                              <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                                <Typography variant="body2" gutterBottom sx={{ fontWeight: 'medium', color: 'primary.main' }}>
                                  {market.key === 'h2h' ? 'Moneyline' : 
                                   market.key === 'spreads' ? 'Spread' : 
                                   market.key === 'totals' ? 'Total (Over/Under)' : 
                                   market.key}
                                </Typography>
                                
                                <Grid container spacing={1}>
                                  {market.outcomes.map((outcome, outcomeIndex) => (
                                    <Grid item key={outcomeIndex}>
                                      <Button
                                        variant="outlined"
                                        size="small"
                                        onClick={() => selectOdds(bookmaker.key, market.key, outcome)}
                                        sx={{ 
                                          borderRadius: '20px',
                                          textTransform: 'none',
                                          fontWeight: 'medium' 
                                        }}
                                      >
                                        {outcome.name} 
                                        {outcome.point !== undefined ? ` ${outcome.point > 0 ? '+' : ''}${outcome.point}` : ''}: 
                                        {' '}{formatOdds(outcome.price)}
                                      </Button>
                                    </Grid>
                                  ))}
                                </Grid>
                              </CardContent>
                            </Card>
                          ))}
                        </Box>
                      ))}
                    </AccordionDetails>
                  </Accordion>
                ))}
              </Box>
            )}
          </Box>
          
          <Box hidden={activeTab !== 1}>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={6}>
                <TextField
                  select
                  label="Sport"
                  name="sport"
                  value={oddsParams.sport}
                  onChange={handleOddsParamsChange}
                  fullWidth
                  SelectProps={{
                    renderValue: (value) => {
                      const option = sportOptions.find(opt => opt.value === value);
                      return (
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Avatar sx={{ width: 24, height: 24, mr: 1, bgcolor: 'primary.main' }}>
                            {option?.icon}
                          </Avatar>
                          {option?.label}
                        </Box>
                      );
                    }
                  }}
                >
                  {sportOptions.filter(opt => 
                    ['basketball_nba', 'basketball_ncaab', 'baseball_mlb'].includes(opt.value)
                  ).map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Avatar sx={{ width: 24, height: 24, mr: 1, bgcolor: 'primary.main' }}>
                          {option.icon}
                        </Avatar>
                        {option.label}
                      </Box>
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  select
                  label="Player Prop Market"
                  value={selectedPlayerMarket}
                  onChange={handlePlayerMarketChange}
                  fullWidth
                  disabled={!selectedEvent}
                >
                  {getAvailableMarkets().filter(market => market.value.includes('player_')).map((market) => (
                    <MenuItem key={market.value} value={market.value}>
                      {market.label}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
            </Grid>
            
            <Button
              variant="contained"
              onClick={fetchCurrentOdds}
              disabled={fetchingOdds || selectedEvent !== null}
              color="secondary"
              sx={{ mt: 3 }}
            >
              {fetchingOdds ? <CircularProgress size={24} /> : 'Fetch Games'}
            </Button>
            
            {selectedEvent && (
              <Button
                variant="outlined"
                onClick={resetPlayerSelection}
                sx={{ mt: 3, ml: 2 }}
              >
                Back to Games
              </Button>
            )}
            
            {errorMessage && (
              <Typography color="error" sx={{ mt: 2 }}>
                {errorMessage}
              </Typography>
            )}
            
            {fetchedEvents.length > 0 && !selectedEvent && (
              <Box sx={{ mt: 4 }}>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', color: 'primary.dark' }}>
                  Select a Game to View Player Props
                </Typography>
                
                <Grid container spacing={2}>
                  {fetchedEvents.map((event) => (
                    <Grid item xs={12} md={6} key={event.id}>
                      <Card 
                        variant="outlined" 
                        sx={{ 
                          cursor: 'pointer',
                          '&:hover': { borderColor: 'primary.main', boxShadow: 1 }
                        }}
                        onClick={() => fetchPlayerProps(event.id)}
                      >
                        <CardContent>
                          <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                            {event.home_team} vs {event.away_team}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {new Date(event.commence_time).toLocaleString()}
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </Box>
            )}
            
            {fetchedPlayerProps.length > 0 && selectedEvent && !selectedPlayer && (
              <Box sx={{ mt: 4 }}>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', color: 'primary.dark' }}>
                  Select a Player for {selectedPlayerMarket.replace('_', ' ')}
                </Typography>
                
                <Grid container spacing={2}>
                  {Object.keys(playersMap).map((playerName, index) => (
                    <Grid item xs={12} md={4} key={index}>
                      <Card 
                        variant="outlined" 
                        sx={{ 
                          cursor: 'pointer',
                          '&:hover': { borderColor: 'primary.main', boxShadow: 1 }
                        }}
                        onClick={() => handlePlayerSelect(playerName)}
                      >
                        <CardContent>
                          <Typography variant="subtitle1" sx={{ fontWeight: 'bold', textAlign: 'center' }}>
                            {playerName}
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </Box>
            )}
            
            {selectedPlayer && selectedEvent && (
              <Box sx={{ mt: 4 }}>
                <Box display="flex" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
                  <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'primary.dark' }}>
                    {selectedPlayer} - {selectedPlayerMarket.replace('player_', '')}
                  </Typography>
                  
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => setSelectedPlayer(null)}
                  >
                    Back to Players
                  </Button>
                </Box>
                
                {/* Group by line/point */}
                {(() => {
                  // Group props by point
                  const pointGroups = {};
                  if (playersMap[selectedPlayer]) {
                    playersMap[selectedPlayer].forEach(prop => {
                      const pointKey = prop.point.toString();
                      if (!pointGroups[pointKey]) {
                        pointGroups[pointKey] = [];
                      }
                      pointGroups[pointKey].push(prop);
                    });
                  }
                  
                  return Object.keys(pointGroups).map((point, pointIndex) => (
                    <Box key={pointIndex} sx={{ mb: 3 }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 'medium', mb: 1 }}>
                        Line: {point}
                      </Typography>
                      
                      <Grid container spacing={2}>
                        {pointGroups[point].map((prop, propIndex) => (
                          <Grid item xs={12} sm={6} md={4} key={propIndex}>
                            <Card 
                              variant="outlined" 
                              sx={{ 
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                '&:hover': { 
                                  borderColor: prop.name === 'Over' ? 'success.main' : 'error.main',
                                  boxShadow: 1,
                                  transform: 'translateY(-2px)'
                                },
                                borderColor: prop.name === 'Over' ? 'success.light' : 'error.light'
                              }}
                              onClick={() => selectPlayerOdds(
                                prop.bookmakerId, 
                                prop.market, 
                                selectedPlayer, 
                                {
                                  name: prop.name,
                                  point: prop.point,
                                  price: prop.price
                                }
                              )}
                            >
                              <CardContent>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <Typography variant="body2" color="text.secondary">
                                    {prop.bookmaker}
                                  </Typography>
                                  <Chip 
                                    label={prop.name} 
                                    size="small"
                                    color={prop.name === 'Over' ? 'success' : 'error'}
                                  />
                                </Box>
                                
                                <Typography variant="h6" sx={{ textAlign: 'center', mt: 1, fontWeight: 'bold' }}>
                                  {formatOdds(prop.price)}
                                </Typography>
                              </CardContent>
                            </Card>
                          </Grid>
                        ))}
                      </Grid>
                    </Box>
                  ));
                })()}
              </Box>
            )}
            
            {selectedEvent && (
              <Button
                variant="outlined"
                onClick={resetPlayerSelection}
                sx={{ mt: 3, ml: 2 }}
              >
                Back to Games
              </Button>
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button 
            onClick={() => setOddsDialogOpen(false)}
            variant="outlined"
          >
            Cancel
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default BettingForm;