import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import StripeCheckout from './components/StripeCheckout';
import { API_BASE_URL, createBooking } from './api';

export default function PaymentPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [paymentData, setPaymentData] = useState(null);
  const [clientSecret, setClientSecret] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const rawData = searchParams.get('data');
    if (!rawData) {
      setError('Datos de pago no encontrados.');
      setLoading(false);
      return;
    }

    try {
      const parsed = JSON.parse(decodeURIComponent(rawData));
      setPaymentData(parsed);

      const createIntent = async () => {
        try {
          const res = await fetch(`${API_BASE_URL}/payments/create-intent`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${window.localStorage.getItem('staygooToken') || ''}`
            },
            body: JSON.stringify({
              amount: Math.round(parsed.total * 100), // Stripe expects cents
              currency: 'usd'
            })
          });

          const data = await res.json();
          if (data.clientSecret) {
            setClientSecret(data.clientSecret);
          } else {
            setError(data.error || 'Error al conectar con Stripe');
          }
        } catch (err) {
          setError('No se pudo establecer conexión con el servidor.');
        } finally {
          setLoading(false);
        }
      };

      createIntent();

    } catch (e) {
      console.error(e);
      setError('Formato de datos de reserva inválido.');
      setLoading(false);
    }
  }, [searchParams]);

  const handleSuccess = async () => {
    try {
      // Extraer el id_housing limpio (numérico)
      const stayObj = paymentData?.data || {};
      const rawId = stayObj.id_housing ?? stayObj.realId ?? stayObj.id ?? '';
      const id_housing = Number(String(rawId).replace('lst-', ''));

      if (!id_housing || isNaN(id_housing)) {
        throw new Error(`id_housing inválido: "${rawId}"`);
      }

      // Campos que SÍ existen en la tabla booking
      await createBooking({
        id_housing,
        start_date: paymentData.checkIn,
        end_date:   paymentData.checkOut,
        total_price: paymentData.total,
        status: 'confirmed',
      });

      // Redirigir a "Mis viajes" para ver la reserva recién creada
      navigate('/member-dashboard', { state: { initialSection: 'trips' } });

    } catch (err) {
      console.error('Error al registrar la reserva:', err);
      // Mostrar el error al usuario para poder diagnosticarlo
      const { default: Swal } = await import('sweetalert2');
      Swal.fire({
        icon: 'warning',
        title: 'Pago exitoso, pero...',
        text: `Tu pago fue procesado correctamente, pero hubo un error al registrar la reserva: ${err.message}. Contacta soporte.`,
        confirmButtonText: 'Ir a mi perfil',
      }).then(() => {
        navigate('/member-dashboard', { state: { initialSection: 'profile' } });
      });
    }
  };

  if (loading) {
    return <div style={{ padding: '40px', textAlign: 'center' }}>Cargando pasarela de pagos...</div>;
  }

  if (error) {
    return <div style={{ padding: '40px', textAlign: 'center', color: 'red' }}>{error}</div>;
  }

  return (
    <div style={{ padding: '40px', maxWidth: '800px', margin: '0 auto', fontFamily: 'system-ui' }}>
      <h1>Completar Reserva</h1>
      
      <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', marginTop: '20px' }}>
        <div style={{ flex: '1 1 300px', border: '1px solid #ddd', padding: '20px', borderRadius: '10px' }}>
          <h3>{paymentData.title}</h3>
          <p>{paymentData.location}</p>
          <img src={paymentData.image} alt={paymentData.title} style={{ width: '100%', borderRadius: '10px' }} />
          
          <ul style={{ listStyle: 'none', padding: 0, marginTop: '20px' }}>
            <li><strong>Llegada:</strong> {paymentData.checkIn}</li>
            <li><strong>Salida:</strong> {paymentData.checkOut}</li>
            <li><strong>Huéspedes:</strong> {paymentData.guests}</li>
            <li><strong>Noches:</strong> {paymentData.nights}</li>
          </ul>
          
          <h2 style={{ borderTop: '1px solid #ddd', paddingTop: '10px', marginTop: '10px' }}>
            Total: ${paymentData.total?.toLocaleString()}
          </h2>
        </div>

        <div style={{ flex: '1 1 300px', padding: '20px' }}>
          <h3>Pago Seguro</h3>
          {clientSecret ? (
            <StripeCheckout clientSecret={clientSecret} onSuccess={handleSuccess} />
          ) : (
            <p>Cargando conexión con Stripe...</p>
          )}
        </div>
      </div>
    </div>
  );
}
