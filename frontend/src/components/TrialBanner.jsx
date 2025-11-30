import React from 'react';
import { Clock } from 'lucide-react';

const TrialBanner = ({ trialInfo, onUpgrade }) => {
  if (!trialInfo || trialInfo.isExpired) return null;

  const isExpiring = trialInfo.daysRemaining <= 7;

  return (
    <div className="trial-banner" style={{
      background: isExpiring ? 'linear-gradient(135deg, #fee2e2, #fecaca)' : 'linear-gradient(135deg, #fef3c7, #fde68a)',
      borderColor: isExpiring ? '#f87171' : '#fcd34d'
    }}>
      <div className="trial-banner-text" style={{ color: isExpiring ? '#991b1b' : '#92400e' }}>
        <Clock size={18} />
        <span>
          Deneme süreniz <strong>{trialInfo.daysRemaining} gün</strong> sonra dolacak. 
          Tüm modüllere erişmeye devam etmek için bir plan seçin.
        </span>
      </div>
      <button className="btn btn-primary btn-sm" onClick={onUpgrade}>
        Planları İncele
      </button>
    </div>
  );
};

export default TrialBanner;
