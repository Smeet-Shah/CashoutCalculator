# Cashout Calculator

A web application for calculating the expected value (EV) of sports betting cashouts.

## Overview

The Cashout Calculator helps bettors make informed decisions on whether to cash out their sports bets or let them ride. By comparing the current cashout offer with the expected value of letting the bet continue, users can maximize their long-term profits.

## Features

- Support for both single and parlay bets
- Add multiple legs to a parlay
- Integration with The Odds API for fetching current odds
- Calculate expected value based on current and original odds
- Compare cashout offers with expected value
- Get recommendations on whether to cash out or let the bet ride

## Tech Stack

- **Frontend:** React, Material UI
- **Backend:** Node.js, Express
- **API Integration:** The Odds API for sports odds data

## Usage

1. Select a bet type (Single or Parlay)
2. Enter your stake (the amount you wagered)
3. For each leg of your bet:
   - Enter the team/side
   - Input the original odds in American format
   - For pending legs, enter the current odds or fetch them from The Odds API
   - Select the status of the leg (Pending, Won, or Lost)
4. Enter the cashout offer from your betting platform
5. Click "Calculate EV" to see the analysis

## Understanding American Odds

- Positive odds (e.g., +200) indicate how much profit you would make on a $100 bet
- Negative odds (e.g., -150) indicate how much you need to bet to make $100 profit

## Formula for Expected Value

For single bets:
```
EV = (Probability_of_Win * Payout_if_Win) - Stake
```

For parlays:
```
EV = (Combined_Probability_of_Pending_Legs * Final_Payout) - Stake
```

The calculator will compare this EV to the cashout offer to make a recommendation.