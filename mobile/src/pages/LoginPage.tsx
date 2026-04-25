import {
  IonContent,
  IonPage,
} from '@ionic/react';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { useAuthStore } from '@asset-simulator/shared';

const LoginPage: React.FC = () => {
  const client = useAuthStore((s) => s.client);

  return (
    <IonPage>
      <IonContent className="ion-padding">
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '100%',
            padding: '1rem',
          }}
        >
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>
            会計＆資産シミュレーター
          </h1>
          <p style={{ color: '#666', marginBottom: '2rem', fontSize: '0.9rem' }}>
            ログインしてください
          </p>
          <div style={{ width: '100%', maxWidth: 400 }}>
            <Auth
              supabaseClient={client}
              appearance={{
                theme: ThemeSupa,
                variables: {
                  default: {
                    colors: {
                      brand: '#3880ff',
                      brandAccent: '#3171e0',
                    },
                  },
                },
              }}
              providers={['google', 'github']}
            />
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default LoginPage;
