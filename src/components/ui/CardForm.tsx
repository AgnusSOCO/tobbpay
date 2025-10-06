import { useState } from "react";
import axios from "axios";

interface CardData {
  cardholderName: string;
  cardNumber: string;
  expirationMonth: string;
  expirationYear: string;
  cvv: string;
  currency: string;
}

export const generateKushkiToken = async (card: CardData) => {
  try {
    const response = await axios.post("https://api-uat.kushkipagos.com/subscriptions/v1/card/tokens", {
      card: {
        name: card.cardholderName,
        number: card.cardNumber,
        expiryMonth: card.expirationMonth,
        expiryYear: card.expirationYear,
        cvv: card.cvv,
      },
      currency: card.currency,
    }, {
      headers: { "Kushki-Merchant-Id": "e7cecc9c336e481f8b164e6d3b49905a", "Content-Type": "application/json" }
    });

    return response.data.Token;
  } catch (err) {
    throw new Error("Failed to generate token: " + err);
  }
};