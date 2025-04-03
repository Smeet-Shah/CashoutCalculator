import React, { useContext } from 'react';
import {
  Box,
  Typography,
  Grid,
  Paper,
  Divider,
  Chip,
  Card,
  CardContent,
  LinearProgress,
  Tooltip,
  useTheme
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import MoneyIcon from '@mui/icons-material/Money';
import PercentIcon from '@mui/icons-material/Percent';
import BalanceIcon from '@mui/icons-material/Balance';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';

const formatCurrency = (value) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
};

const formatPercentage = (value) => {
  // Convert to percentage (multiply by 100)
  const percentage = value * 100;
  
  // For very small percentages, show "< 0.01%"
  if (percentage < 0.01 && percentage > 0) {
    return "< 0.01%";
  }
  
  return new Intl.NumberFormat('en-US', {
    style: 'percent',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
};

// Add a formatter for expected value with sign
const formatExpectedValue = (value) => {
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    signDisplay: 'always'
  });
  return formatter.format(value);
};

// Add a more explanatory caption to help users understand the calculation
const ResultsCard = ({ title, children, icon, caption }) => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';
  
  return (
    <Card 
      variant="outlined" 
      sx={{ 
        height: '100%',
        border: isDarkMode ? `1px solid ${theme.palette.divider}` : `1px solid ${theme.palette.grey[200]}`,
      }}
    >
      <CardContent>
        <Box display="flex" alignItems="center" sx={{ mb: 2 }}>
          {icon}
          <Typography variant="h6" sx={{ fontWeight: 'bold', ml: 1 }}>
            {title}
          </Typography>
        </Box>
        {children}
        {caption && (
          <Typography 
            variant="caption" 
            color="text.secondary" 
            sx={{ display: 'block', mt: 2, fontStyle: 'italic' }}
          >
            {caption}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
};

const ResultsDisplay = ({ results }) => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';
  
  const {
    expectedValue,
    payoutFactor,
    potentialPayout,
    combinedProbability,
    cashoutOffer,
    recommendation
  } = results;

  // Determine if it's better to cash out or let it ride
  const isCashoutBetter = expectedValue <= cashoutOffer;
  
  // Calculate how much better one option is compared to the other
  const differenceAmount = Math.abs(cashoutOffer - expectedValue);
  const baseValue = Math.max(Math.abs(expectedValue), 0.01); // Avoid division by zero
  const differencePercentage = Math.min(
    differenceAmount / baseValue,
    1 // Cap at 100%
  );
  
  // Check if EV is very close to zero (to handle -0.00 display issues)
  const isEVEffectivelyZero = Math.abs(expectedValue) < 0.01;

  return (
    <Box>
      <Box 
        display="flex" 
        flexDirection={{ xs: 'column', sm: 'row' }}
        alignItems={{ xs: 'flex-start', sm: 'center' }}
        gap={2}
        sx={{ mb: 4 }}
      >
        <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
          Analysis Results
        </Typography>
        <Chip
          icon={isCashoutBetter ? <CheckCircleIcon /> : <CancelIcon />}
          label={isCashoutBetter ? 'CASH OUT NOW' : 'LET IT RIDE'}
          color={isCashoutBetter ? 'success' : 'warning'}
          size="medium"
          sx={{ 
            fontWeight: 'bold', 
            fontSize: '0.9rem',
            px: 1,
            boxShadow: isDarkMode 
              ? '0 2px 8px rgba(0,0,0,0.5)' 
              : '0 2px 8px rgba(0,0,0,0.1)',
          }}
        />
      </Box>

      <Grid container spacing={3}>
        {/* Recommendation Card */}
        <Grid item xs={12}>
          <Card 
            elevation={3}
            sx={{ 
              position: 'relative',
              overflow: 'hidden',
              mb: 3,
              borderRadius: 3,
              background: isDarkMode ? 
                `linear-gradient(to right, ${theme.palette.background.paper}, ${isCashoutBetter ? 'rgba(102, 187, 106, 0.1)' : 'rgba(255, 202, 40, 0.1)'})` : 
                `linear-gradient(to right, ${theme.palette.background.paper}, ${isCashoutBetter ? 'rgba(67, 160, 71, 0.05)' : 'rgba(255, 160, 0, 0.05)'})`,
              borderLeft: `6px solid ${isCashoutBetter ? theme.palette.success.main : theme.palette.warning.main}`,
              boxShadow: isDarkMode 
                ? '0 8px 24px rgba(0,0,0,0.3)' 
                : '0 8px 24px rgba(0,0,0,0.08)',
              p: 0
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 2 }}>
                {isCashoutBetter ? 'Take the Cashout Offer' : 'Keep Your Bet Active'}
              </Typography>
              
              <Box display="flex" alignItems="center" sx={{ mb: 2 }}>
                <BalanceIcon sx={{ mr: 1.5, color: 'primary.main' }} />
                <Typography variant="body1">
                  {recommendation}
                </Typography>
              </Box>
              
              <Divider sx={{ my: 2 }} />
              
              <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 'medium' }}>
                Value Comparison:
              </Typography>
              
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} sm={4} sx={{ textAlign: 'center' }}>
                  <Typography variant="body2" color="text.secondary">
                    Cashout Offer
                  </Typography>
                  <Typography 
                    variant="h6" 
                    color={isCashoutBetter ? 'success.main' : 'text.primary'} 
                    sx={{ 
                      fontWeight: 'bold',
                      fontSize: '1.5rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center', 
                      mt: 1
                    }}
                  >
                    {isCashoutBetter && <TrendingUpIcon fontSize="small" sx={{ mr: 0.5 }} />}
                    {formatCurrency(cashoutOffer)}
                  </Typography>
                </Grid>
                
                <Grid item xs={12} sm={4} sx={{ textAlign: 'center' }}>
                  <Box sx={{ position: 'relative', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <LinearProgress 
                      variant="determinate" 
                      value={differencePercentage * 100} 
                      sx={{ 
                        width: '100%', 
                        height: 10, 
                        borderRadius: 5,
                        bgcolor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                        '& .MuiLinearProgress-bar': {
                          borderRadius: 5,
                          bgcolor: isCashoutBetter ? 'success.main' : 'warning.main'
                        }
                      }} 
                    />
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        position: 'absolute', 
                        fontWeight: 'bold',
                        color: 'text.secondary'
                      }}
                    >
                      {differencePercentage > 0.01 ? 
                        `${Math.round(differencePercentage * 100)}% difference` : 
                        'Nearly Equal'}
                    </Typography>
                  </Box>
                </Grid>
                
                <Grid item xs={12} sm={4} sx={{ textAlign: 'center' }}>
                  <Typography variant="body2" color="text.secondary">
                    Expected Value
                  </Typography>
                  <Typography 
                    variant="h6" 
                    color={!isCashoutBetter ? 'warning.main' : 'text.primary'} 
                    sx={{ 
                      fontWeight: 'bold',
                      fontSize: '1.5rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mt: 1
                    }}
                  >
                    {!isCashoutBetter && <TrendingUpIcon fontSize="small" sx={{ mr: 0.5 }} />}
                    {formatCurrency(expectedValue)}
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <ResultsCard 
            title="Betting Details" 
            icon={<MoneyIcon sx={{ color: 'primary.main' }} />}
            caption="Potential payout and multiplier are calculated using the original odds at bet placement"
          >
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">
                  Potential Payout:
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body1" fontWeight="bold" sx={{ fontSize: '1.1rem' }}>
                  {formatCurrency(potentialPayout)}
                </Typography>
              </Grid>

              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">
                  Payout Multiplier:
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body1" fontWeight="bold" sx={{ fontSize: '1.1rem' }}>
                  {payoutFactor.toFixed(2)}x
                </Typography>
              </Grid>

              <Grid item xs={12}>
                <Divider sx={{ my: 1 }} />
              </Grid>

              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">
                  Expected Value:
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography 
                  variant="body1" 
                  fontWeight="bold" 
                  color={
                    isEVEffectivelyZero ? 'text.primary' :
                    expectedValue > 0 ? 'success.main' : 'error.main'
                  }
                  sx={{ fontSize: '1.1rem' }}
                >
                  {formatCurrency(expectedValue)}
                </Typography>
              </Grid>

              <Grid item xs={12}>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1, fontStyle: 'italic' }}>
                  Based on original odds and current win probability
                </Typography>
              </Grid>
            </Grid>
          </ResultsCard>
        </Grid>

        <Grid item xs={12} md={6}>
          <ResultsCard 
            title="Probability Analysis" 
            icon={<PercentIcon sx={{ color: 'primary.main' }} />}
            caption="Win probability is calculated from current odds. EV = Probability × Potential Payout - Stake"
          >
            <Box display="flex" alignItems="center" sx={{ mb: 1 }}>
              <Typography variant="body2" sx={{ fontWeight: 'medium', mr: 1 }}>
                Probability Analysis:
              </Typography>
              <Tooltip title="Win probability is calculated from current odds. Higher probability means a more likely win but usually comes with lower payouts.">
                <HelpOutlineIcon fontSize="small" color="action" />
              </Tooltip>
            </Box>
            
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">
                  Win Probability:
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography 
                  variant="body1" 
                  fontWeight="bold"
                  sx={{ 
                    fontSize: '1.1rem',
                    color: combinedProbability > 0.75 ? 'success.main' : 
                           combinedProbability > 0.5 ? 'primary.main' : 
                           combinedProbability > 0.25 ? 'warning.main' : 'error.main'
                  }}
                >
                  {formatPercentage(combinedProbability)}
                </Typography>
              </Grid>

              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">
                  Cashout Offer:
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body1" fontWeight="bold" sx={{ fontSize: '1.1rem' }}>
                  {formatCurrency(cashoutOffer)}
                </Typography>
              </Grid>

              <Grid item xs={12}>
                <Divider sx={{ my: 1 }} />
              </Grid>

              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">
                  Value Difference:
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Box display="flex" alignItems="center">
                  {isCashoutBetter ? 
                    <TrendingUpIcon fontSize="small" sx={{ color: 'success.main', mr: 0.5 }} /> : 
                    <TrendingDownIcon fontSize="small" sx={{ color: 'error.main', mr: 0.5 }} />
                  }
                  <Typography 
                    variant="body1" 
                    fontWeight="bold"
                    color={isCashoutBetter ? 'success.main' : 'error.main'}
                    sx={{ fontSize: '1.1rem' }}
                  >
                    {isCashoutBetter ? '+' : '-'}{formatCurrency(Math.abs(cashoutOffer - expectedValue))}
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </ResultsCard>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ResultsDisplay; 