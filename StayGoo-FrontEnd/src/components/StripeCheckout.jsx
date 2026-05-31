import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { useState } from 'react';

// Cargar la llave publica desde las variables de entono
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

function CheckoutForm({ onSuccess }) {
  const stripe = useStripe();
  const elements = useElements();
  const [errorMessage, setErrorMessage] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      redirect: 'if_required'
    });

    if (error) {
      setErrorMessage(error.message);
      setIsProcessing(false);
    } else if (paymentIntent && paymentIntent.status === 'succeeded') {
      // Todo salio bien
      setIsProcessing(false);
      if (onSuccess) onSuccess(paymentIntent);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{maxWidth: '400px', margin: '0 auto'}}>
      <PaymentElement />
      <button 
        disabled={!stripe || isProcessing} 
        style={{
            marginTop: '20px', 
            padding: '10px', 
            background: '#0ea5e9', 
            color: '#fff', 
            border: 'none', 
            borderRadius: '5px',
            width: '100%',
            cursor: 'pointer'
        }}>
        {isProcessing ? 'Procesando...' : 'Pagar Ahora'}
      </button>
      {errorMessage && <div style={{color: 'red', marginTop: '10px'}}>{errorMessage}</div>}
    </form>
  );
}

// Este envoltorio es necesario para proveer la configuración (el secret de la intención de pago) a Elements de Stripe
export default function StripeCheckout({ clientSecret, onSuccess }) {
  const options = {
    clientSecret,
    // Puedes personalizar la apariencia aquí
    appearance: {
        theme: 'stripe',
    }
  };

  return (
    <Elements stripe={stripePromise} options={options}>
      <CheckoutForm onSuccess={onSuccess} />
    </Elements>
  );
}
