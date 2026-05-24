#!/usr/bin/env bash
# Add 17 remaining STRIPE_PRICE_* env vars to Vercel (production + development)
# The MINI_NONE production was already added by a previous attempt.

set +e  # Continue on errors

entries=(
  "STRIPE_PRICE_MINI_NONE development price_1TadzzBzdealP8SFAW0GDEkm"
  "STRIPE_PRICE_MINI_6M production price_1TadzzBzdealP8SFQudS4Jl7"
  "STRIPE_PRICE_MINI_6M development price_1TadzzBzdealP8SFQudS4Jl7"
  "STRIPE_PRICE_MINI_12M production price_1Tae00BzdealP8SFJ6OyhMgX"
  "STRIPE_PRICE_MINI_12M development price_1Tae00BzdealP8SFJ6OyhMgX"
  "STRIPE_PRICE_CLASSIQUE_NONE production price_1Tae00BzdealP8SFYueftNVC"
  "STRIPE_PRICE_CLASSIQUE_NONE development price_1Tae00BzdealP8SFYueftNVC"
  "STRIPE_PRICE_CLASSIQUE_6M production price_1Tae00BzdealP8SFzADItnwN"
  "STRIPE_PRICE_CLASSIQUE_6M development price_1Tae00BzdealP8SFzADItnwN"
  "STRIPE_PRICE_CLASSIQUE_12M production price_1Tae00BzdealP8SFCBqKTQhw"
  "STRIPE_PRICE_CLASSIQUE_12M development price_1Tae00BzdealP8SFCBqKTQhw"
  "STRIPE_PRICE_FAMILLE_NONE production price_1Tae01BzdealP8SFZKtuJ80s"
  "STRIPE_PRICE_FAMILLE_NONE development price_1Tae01BzdealP8SFZKtuJ80s"
  "STRIPE_PRICE_FAMILLE_6M production price_1Tae01BzdealP8SFLvEAMs2f"
  "STRIPE_PRICE_FAMILLE_6M development price_1Tae01BzdealP8SFLvEAMs2f"
  "STRIPE_PRICE_FAMILLE_12M production price_1Tae01BzdealP8SFr4JUgVI3"
  "STRIPE_PRICE_FAMILLE_12M development price_1Tae01BzdealP8SFr4JUgVI3"
)

i=0
total=${#entries[@]}
for entry in "${entries[@]}"; do
  i=$((i+1))
  read -r name env value <<< "$entry"
  echo "[$i/$total] $name ($env)"
  npx vercel@latest env add "$name" "$env" --value "$value" --yes 2>&1 | tail -3
  echo "---"
done
echo "ALL_DONE"
