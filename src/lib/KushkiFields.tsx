import { useEffect, useRef, useState } from "react";

interface KushkiFieldsProps {
    onTokenReceived: (token: string) => void;
    amount?: number; // optional for future one-time payments
}

const KushkiFields = ({ onTokenReceived, amount }: KushkiFieldsProps) => {
    const cardRef = useRef<HTMLDivElement>(null);
    const [kushki, setKushki] = useState<Kushki | null>(null);

    useEffect(() => {
        if (cardRef.current) {
            const k = new (window as any).Kushki({
                merchantId: process.env.KUSHKI_MERCHANT_ID,
                inTestEnvironment: true,
            });
            setKushki(k);

            k.renderHostedFields(cardRef.current, {
                form: {
                    cardholderName: "#cardholder-name",
                    cardNumber: "#card-number",
                    expirationDate: "#expiry-date",
                },
                styles: {
                    input: {
                        color: "#000",
                        fontSize: "16px",
                        padding: "8px",
                    },
                },
            });
        }
    }, []);

    const handleGetToken = async () => {
        if (!kushki) return;
        try {
            const response = await kushki.requestCardToken({
                cardholderName: (document.getElementById("cardholder-name") as HTMLInputElement).value,
                cardNumber: (document.getElementById("card-number") as HTMLInputElement).value,
                expirationDate: (document.getElementById("expiry-date") as HTMLInputElement).value,
            });
            if (response.token) {
                onTokenReceived(response.token);
            } else {
                console.error("Kushki token error", response);
            }
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div>
            <div ref={cardRef}></div>
            <input id="cardholder-name" placeholder="Cardholder Name" className="border p-2 mb-2 w-full" />
            <input id="card-number" placeholder="Card Number" className="border p-2 mb-2 w-full" />
            <input id="expiry-date" placeholder="MM/YY" className="border p-2 mb-2 w-full" />
            <button type="button" onClick={handleGetToken} className="btn btn-primary">
                Generate Token
            </button>
        </div>
    );
};

export default KushkiFields;
