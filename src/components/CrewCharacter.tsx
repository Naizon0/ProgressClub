import React from 'react';

export type CharacterPose = 'idle' | 'focused' | 'typing' | 'celebrating' | 'resting' | 'challenge-complete' | 'exercising' | 'yoga';

interface CrewCharacterProps {
  characterId: string;
  pose: CharacterPose;
  className?: string;
  height?: number; // rough height target
  focusActivity?: 'desk-work' | 'exercise';
  exerciseType?: 'dumbbells' | 'punching';
  hasAstronautHelmet?: boolean;
}

export const CrewCharacter: React.FC<CrewCharacterProps> = ({
  characterId,
  pose,
  className = '',
  height = 180,
  focusActivity = 'desk-work',
  exerciseType = 'dumbbells',
  hasAstronautHelmet = false,
}) => {
  // Let's retrieve character styling based on id
  const getCharacterColors = () => {
    switch (characterId) {
      case 'blaze':
        return { hoodie: '#ea580c', pants: '#262626', mask: '#fdba74', accent: '#f97316' };
      case 'frost':
        return { hoodie: '#bae6fd', pants: '#404040', mask: '#ffffff', accent: '#e0f2fe' };
      case 'dusk':
        return { hoodie: '#6b21a8', pants: '#172554', mask: '#c084fc', accent: '#a855f7' };
      case 'ember':
        return { hoodie: '#991b1b', pants: '#171717', mask: '#f87171', accent: '#b91c1c' };
      case 'mantis':
        return { hoodie: '#86efac', pants: '#1f2937', mask: '#bbf7d0', accent: '#22c55e' };
      case 'volt':
        return { hoodie: '#facc15', pants: '#374151', mask: '#fef08a', accent: '#eab308' };
      case 'monument':
        return { hoodie: '#f5f5f5', pants: '#e5e5e5', mask: '#0a0a0a', accent: '#ffffff' };
      case 'cipher':
      default:
        return { hoodie: '#171717', pants: '#0a0a0a', mask: '#262626', accent: '#171717' };
    }
  };

  const colors = getCharacterColors();
  const isMonument = characterId === 'monument';

  // Compute final sizing with Monument being 25% larger
  const scaleMultiplier = isMonument ? 1.25 : 1.0;
  const currentHeight = Math.round(height * scaleMultiplier);
  const currentWidth = Math.round(currentHeight * 0.85);

  // We write unique keyframe animations embedded inside a style tag
  // We avoid name collisions by prefixing with the characterId and pose
  const animationStyles = `
    @keyframes breathing-${characterId} {
      0%, 100% { transform: translateY(0) scaleY(1); }
      50% { transform: translateY(-3px) scaleY(1.02); }
    }

    @keyframes weight-shift-${characterId} {
      0%, 100% { transform: translateX(0) rotate(0deg); }
      50% { transform: translateX(4px) rotate(1.5deg); }
    }

    @keyframes frost-nod {
      0%, 100% { transform: translateY(0); }
      90% { transform: translateY(0); }
      95% { transform: translateY(4px); }
    }

    @keyframes walk-bounce-${characterId} {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-4px); }
    }

    @keyframes typing-stump-l {
      0%, 100% { transform: translateY(0px); }
      50% { transform: translateY(-8px); }
    }

    @keyframes typing-stump-r {
      0%, 100% { transform: translateY(-6px); }
      50% { transform: translateY(1px); }
    }

    @keyframes volt-tapping {
      0%, 100% { transform: rotate(0deg); }
      50% { transform: rotate(15deg); }
    }

    @keyframes celebrate-jump-${characterId} {
      0%, 100% { transform: translateY(0) scale(1); }
      50% { transform: translateY(-16px) scale(0.95, 1.05); }
    }

    @keyframes celebrate-rock-${characterId} {
      0%, 100% { transform: rotate(-5deg) translateY(0); }
      50% { transform: rotate(5deg) translateY(-4px); }
    }

    @keyframes celebrate-spin-${characterId} {
      0% { transform: rotate(0deg) scale(1); }
      50% { transform: rotate(180deg) scale(1.08); }
      100% { transform: rotate(360deg) scale(1); }
    }

    @keyframes salute-slow {
      0% { transform: translateY(0) rotate(0deg); }
      20%, 80% { transform: translateY(-4px) rotate(-65deg); }
      100% { transform: translateY(0) rotate(0deg); }
    }

    @keyframes floaty-arms {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-6px); }
    }

    @keyframes lift-weight-l-${characterId} {
      0%, 100% { transform: rotate(-35deg) translateY(0px); }
      50% { transform: rotate(-135deg) translateY(-2px); }
    }

    @keyframes lift-weight-r-${characterId} {
      0%, 100% { transform: rotate(35deg) translateY(0px); }
      50% { transform: rotate(135deg) translateY(-2px); }
    }

    @keyframes squat-bounce-${characterId} {
      0%, 100% { transform: translateY(0) scaleY(1); }
      50% { transform: translateY(3px) scaleY(0.97); }
    }

    @keyframes yoga-float-${characterId} {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-5px); }
    }

    @keyframes dumbbell-bounce-${characterId} {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(3px); }
    }

    @keyframes dumbbell-curl-l-${characterId} {
      0%, 100% { transform: rotate(-35deg); }
      50% { transform: rotate(50deg); }
    }

    @keyframes dumbbell-curl-r-${characterId} {
      0%, 100% { transform: rotate(35deg); }
      50% { transform: rotate(-50deg); }
    }

    @keyframes bag-swing-${characterId} {
      0%, 100% { transform: rotate(0deg); }
      50% { transform: rotate(8deg); }
    }

    @keyframes punch-l-${characterId} {
      0%, 100% { transform: translateX(0); }
      50% { transform: translateX(-4px); }
    }

    @keyframes punch-r-${characterId} {
      0%, 100% { transform: translateX(0); }
      50% { transform: translateX(12px); }
    }

    @keyframes volt-aura-glow-${characterId} {
      0%, 100% { transform: scale(1); opacity: 0.7; }
      50% { transform: scale(1.06); opacity: 1; }
    }

    @keyframes spark-shimmer-${characterId} {
      0%, 100% { opacity: 0.35; transform: scale(0.9) rotate(0deg); }
      50% { opacity: 0.95; transform: scale(1.1) rotate(15deg); }
    }

    @keyframes cipher-aura-glow-${characterId} {
      0%, 100% { transform: scale(1) rotate(0deg); opacity: 0.6; }
      50% { transform: scale(1.08) rotate(180deg); opacity: 0.85; }
    }

    @keyframes cipher-glitch-${characterId} {
      0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.4; }
      33% { transform: translate(-1.5px, 1px) scale(1.05); opacity: 0.9; }
      66% { transform: translate(1.5px, -1px) scale(0.95); opacity: 0.75; }
    }

    @keyframes blaze-aura-glow-${characterId} {
      0%, 100% { transform: scale(1); opacity: 0.7; }
      50% { transform: scale(1.1); opacity: 0.95; }
    }

    @keyframes fire-flicker-${characterId} {
      0%, 100% { transform: scaleY(1) translateY(0); opacity: 0.6; }
      50% { transform: scaleY(1.2) translateY(-4px); opacity: 0.95; }
    }

    @keyframes frost-aura-glow-${characterId} {
      0%, 100% { transform: scale(1); opacity: 0.6; }
      50% { transform: scale(1.04); opacity: 0.85; }
    }

    @keyframes snow-drift-${characterId} {
      0%, 100% { transform: translate(0, 0) rotate(0deg); opacity: 0.4; }
      50% { transform: translate(3px, -5px) rotate(45deg); opacity: 0.9; }
    }

    @keyframes dusk-aura-glow-${characterId} {
      0%, 100% { transform: scale(1) rotate(0deg); opacity: 0.6; }
      50% { transform: scale(1.06) rotate(6deg); opacity: 0.9; }
    }

    @keyframes star-twinkle-${characterId} {
      0%, 100% { opacity: 0.2; transform: scale(0.8) rotate(0deg); }
      50% { opacity: 1; transform: scale(1.2) rotate(90deg); }
    }

    @keyframes ember-aura-glow-${characterId} {
      0%, 100% { transform: scale(1); opacity: 0.65; }
      50% { transform: scale(1.07); opacity: 0.9; }
    }

    @keyframes ember-sparks-${characterId} {
      0%, 100% { transform: translateY(0) scale(0.9); opacity: 0.4; fill: #b91c1c; }
      50% { transform: translateY(-7px) scale(1.15); opacity: 0.95; fill: #ef4444; }
    }

    @keyframes mantis-aura-glow-${characterId} {
      0%, 100% { transform: scale(0.9); opacity: 0.3; }
      50% { transform: scale(1.1); opacity: 0.75; }
    }

    @keyframes leaf-rotate-${characterId} {
      0%, 100% { transform: rotate(-10deg) translate(0, 0); }
      50% { transform: rotate(15deg) translate(2px, -3px); }
    }

    @keyframes monument-aura-glow-${characterId} {
      0%, 100% { transform: scale(1); opacity: 0.65; }
      50% { transform: scale(1.08); opacity: 0.95; }
    }

    @keyframes gold-glint-${characterId} {
      0%, 100% { opacity: 0.4; transform: rotate(0deg) scale(0.8); }
      50% { opacity: 1; transform: rotate(180deg) scale(1.2); }
    }

    .sh-body-${characterId}-${pose} {
      transform-origin: bottom center;
    }
  `;

  // Determine which CSS class/styles apply to body/head/arms
  let bodyAnimStyle: React.CSSProperties = {};
  let headAnimStyle: React.CSSProperties = {};
  let leftArmStyle: React.CSSProperties = {};
  let rightArmStyle: React.CSSProperties = {};

  if (pose === 'idle') {
    if (characterId === 'cipher') {
      bodyAnimStyle = { animation: `breathing-${characterId} 4s ease-in-out infinite` };
    } else if (characterId === 'blaze') {
      bodyAnimStyle = { animation: `weight-shift-${characterId} 3.5s ease-in-out infinite` };
    } else if (characterId === 'frost') {
      headAnimStyle = { animation: 'frost-nod 5s ease-in-out infinite' };
    } else if (characterId === 'dusk') {
      bodyAnimStyle = { animation: `weight-shift-${characterId} 4.5s ease-in-out infinite` };
    } else if (characterId === 'ember') {
      bodyAnimStyle = { animation: `walk-bounce-${characterId} 0.8s ease-in-out infinite` };
    } else if (characterId === 'mantis') {
      bodyAnimStyle = { animation: `breathing-${characterId} 5.5s cubic-bezier(0.4, 0, 0.2, 1) infinite` };
    } else if (characterId === 'volt') {
      bodyAnimStyle = { animation: `breathing-${characterId} 3.8s ease-in-out infinite` };
    } else if (characterId === 'monument') {
      // Motionless
    }
  } else if (pose === 'focused') {
    bodyAnimStyle = { transform: 'scale(1.02) rotate(3deg) skewX(2deg)', transformOrigin: 'bottom center' };
  } else if (pose === 'typing') {
    bodyAnimStyle = { animation: `walk-bounce-${characterId} 0.5s ease-in-out infinite` };
    leftArmStyle = { animation: 'typing-stump-l 0.25s ease-in-out infinite' };
    rightArmStyle = { animation: 'typing-stump-r 0.25s ease-in-out infinite' };
  } else if (pose === 'exercising') {
    if (exerciseType === 'dumbbells') {
      bodyAnimStyle = { animation: `dumbbell-bounce-${characterId} 1.5s ease-in-out infinite`, transformOrigin: 'bottom center' };
      leftArmStyle = { animation: `dumbbell-curl-l-${characterId} 1.5s ease-in-out infinite`, transformOrigin: '36px 66px' };
      rightArmStyle = { animation: `dumbbell-curl-r-${characterId} 1.5s ease-in-out infinite`, transformOrigin: '64px 66px' };
    } else {
      bodyAnimStyle = { animation: `squat-bounce-${characterId} 0.5s ease-in-out infinite`, transformOrigin: 'bottom center' };
      leftArmStyle = { animation: `punch-l-${characterId} 0.5s ease-in-out infinite`, transformOrigin: '36px 66px' };
      rightArmStyle = { animation: `punch-r-${characterId} 0.5s ease-in-out infinite`, transformOrigin: '64px 66px' };
    }
  } else if (pose === 'yoga') {
    bodyAnimStyle = { animation: `yoga-float-${characterId} 3s ease-in-out infinite`, transformOrigin: 'bottom center' };
    leftArmStyle = { transform: 'rotate(50deg)', transformOrigin: '36px 66px' };
    rightArmStyle = { transform: 'rotate(-50deg)', transformOrigin: '64px 66px' };
  } else if (pose === 'celebrating' || pose === 'challenge-complete') {
    if (characterId === 'cipher') {
      bodyAnimStyle = { animation: `celebrate-rock-${characterId} 1s ease-in-out infinite` };
    } else if (characterId === 'blaze') {
      bodyAnimStyle = { animation: `celebrate-jump-${characterId} 1.2s ease-in-out infinite` };
      rightArmStyle = { animation: 'typing-stump-l 0.15s ease-in-out infinite' };
    } else if (characterId === 'frost') {
      bodyAnimStyle = { animation: `breathing-${characterId} 2.5s ease-in-out infinite` };
      leftArmStyle = { animation: 'floaty-arms 2s ease-in-out infinite' };
      rightArmStyle = { animation: 'floaty-arms 2s ease-in-out infinite' };
    } else if (characterId === 'dusk') {
      bodyAnimStyle = { animation: `celebrate-spin-${characterId} 3s cubic-bezier(0.4, 0, 0.2, 1) infinite`, transformOrigin: 'center center' };
    } else if (characterId === 'ember') {
      bodyAnimStyle = { animation: `celebrate-jump-${characterId} 0.6s ease-in-out infinite` };
    } else if (characterId === 'mantis') {
      bodyAnimStyle = { animation: `breathing-${characterId} 3s ease-in-out infinite` };
      leftArmStyle = { animation: 'floaty-arms 3s ease-in-out infinite' };
    } else if (characterId === 'volt') {
      bodyAnimStyle = { animation: `celebrate-jump-${characterId} 0.8s ease-in-out infinite` };
    } else if (characterId === 'monument') {
      leftArmStyle = { animation: 'salute-slow 5s ease-in-out infinite' };
    }
  }

  // Draw the customized badge on the chest based on character
  const renderChestGeometry = () => {
    switch (characterId) {
      case 'blaze':
        return (
          // Flame shaped angular patch (diamonds or triangles)
          <polygon points="45,85 55,85 50,72" fill={colors.accent} stroke="#0a0a0a" strokeWidth="1.5" />
        );
      case 'frost':
        return (
          // Snowflake asterisk emblem - elegant, non-abs style
          <g>
            <circle cx="50" cy="80" r="2" fill={colors.accent || "#7dd3fc"} stroke="#0a0a0a" strokeWidth="1" />
            <line x1="43" y1="80" x2="57" y2="80" stroke="#0a0a0a" strokeWidth="1.2" />
            <line x1="50" y1="73" x2="50" y2="87" stroke="#0a0a0a" strokeWidth="1.2" />
            <line x1="45" y1="75" x2="55" y2="85" stroke="#0a0a0a" strokeWidth="1.0" />
            <line x1="45" y1="85" x2="55" y2="75" stroke="#0a0a0a" strokeWidth="1.0" />
          </g>
        );
      case 'dusk':
        return (
          // Dot constellation patch on shoulder
          <g transform="translate(10, -5)">
            <circle cx="28" cy="74" r="1.5" fill={colors.accent} stroke="#0a0a0a" strokeWidth="1" />
            <circle cx="34" cy="76" r="1" fill={colors.accent} stroke="#0a0a0a" strokeWidth="1" />
            <circle cx="25" cy="80" r="1.5" fill={colors.accent} stroke="#0a0a0a" strokeWidth="1" />
          </g>
        );
      case 'ember':
        return (
          // Bold geometric stripe (horizontal rectangle)
          <rect x="40" y="78" width="20" height="5" fill="#111827" rx="1" />
        );
      case 'mantis':
        return (
          // Leaf emblem instead of grid line
          <g>
            <path d="M 50,74 C 44,80 44,86 50,88 C 56,86 56,80 50,74" fill={colors.accent || "#4ade80"} stroke="#0a0a0a" strokeWidth="1.2" />
          </g>
        );
      case 'volt':
        return (
          // Lightning zigzag on chest
          <polygon points="50,72 44,82 48,82 44,90 54,80 50,80" fill={colors.accent} stroke="#0a0a0a" strokeWidth="1.5" />
        );
      default:
        return null;
    }
  };

  // Compute shoulder-anchored joint positions of arms with real elbow joints!
  let lShoulderX = 36;
  let lShoulderY = 66;
  let lElbowX = 28;
  let lElbowY = 78;
  let lHandX = 32;
  let lHandY = 90;

  let rShoulderX = 64;
  let rShoulderY = 66;
  let rElbowX = 72;
  let rElbowY = 78;
  let rHandX = 68;
  let rHandY = 90;

  let lArmRotation = 0;
  let rArmRotation = 0;

  if (pose === 'focused') {
    lShoulderX = 36;
    lShoulderY = 70;
    lElbowX = 22;
    lElbowY = 82;
    lHandX = 26;
    lHandY = 96;
  } else if (pose === 'typing') {
    lShoulderX = 36;
    lShoulderY = 66;
    lElbowX = 20;
    lElbowY = 76;
    lHandX = 32;
    lHandY = 82;
  } else if (pose === 'celebrating' || pose === 'challenge-complete') {
    if (characterId === 'monument') {
      lShoulderX = 36;
      lShoulderY = 66;
      lElbowX = 20;
      lElbowY = 56;
      lHandX = 14;
      lHandY = 46;

      rShoulderX = 64;
      rShoulderY = 66;
      rElbowX = 80;
      rElbowY = 56;
      rHandX = 86;
      rHandY = 46;
    } else {
      lShoulderX = 36;
      lShoulderY = 62;
      lElbowX = 24;
      lElbowY = 46;
      lHandX = 16;
      lHandY = 28;

      rShoulderX = 64;
      rShoulderY = 62;
      rElbowX = 76;
      rElbowY = 46;
      rHandX = 84;
      rHandY = 28;
    }
  } else if (pose === 'resting') {
    lShoulderX = 36;
    lShoulderY = 66;
    lElbowX = 28;
    lElbowY = 78;
    lHandX = 30;
    lHandY = 90;

    rShoulderX = 64;
    rShoulderY = 66;
    rElbowX = 72;
    rElbowY = 78;
    rHandX = 70;
    rHandY = 90;
  } else if (pose === 'exercising') {
    if (exerciseType === 'dumbbells') {
      lShoulderX = 36;
      lShoulderY = 66;
      lElbowX = 24;
      lElbowY = 80;
      lHandX = 26;
      lHandY = 94;

      rShoulderX = 64;
      rShoulderY = 66;
      rElbowX = 76;
      rElbowY = 80;
      rHandX = 74;
      rHandY = 94;
    } else {
      // Punching style
      lShoulderX = 36;
      lShoulderY = 66;
      lElbowX = 22;
      lElbowY = 60;
      lHandX = 14;
      lHandY = 56;

      rShoulderX = 64;
      rShoulderY = 66;
      rElbowX = 72;
      rElbowY = 62;
      rHandX = 85;
      rHandY = 62;
    }
  } else if (pose === 'yoga') {
    lShoulderX = 36;
    lShoulderY = 66;
    lElbowX = 20;
    lElbowY = 74;
    lHandX = 14;
    lHandY = 82;

    rShoulderX = 64;
    rShoulderY = 66;
    rElbowX = 80;
    rElbowY = 74;
    rHandX = 86;
    rHandY = 82;
  }

  // Draw the SVG! Since it's clean, solid, blocky humanoid figures:
  // Layout coordinates relative to a viewBox of "0 0 100 150"
  return (
    <div className={`relative flex flex-col items-center justify-center ${className}`}>
      {/* CSS Keyframes */}
      <style dangerouslySetInnerHTML={{ __html: animationStyles }} />

      <svg
        width={currentWidth}
        height={currentHeight}
        viewBox="0 0 100 150"
        className="overflow-visible select-none"
        id={`char-svg-${characterId}`}
      >
        <g style={bodyAnimStyle} className={`sh-body-${characterId}-${pose}`}>
          {/* Shadow below character */}
          <ellipse cx="50" cy="138" rx="28" ry="6" fill="#000000" opacity="0.12" />

          {/* Theme-based Character Aura */}
          {characterId === 'cipher' && (
            <g id="cipher-aura" className="pointer-events-none" style={{ animation: `cipher-aura-glow-${characterId} 3s ease-in-out infinite`, transformOrigin: '50px 75px' }}>
              <ellipse cx="50" cy="72" rx="36" ry="46" fill="#10b981" opacity="0.12" filter="blur(4px)" />
              <circle cx="20" cy="50" r="1.5" fill="#10b981" opacity="0.8" style={{ animation: `cipher-glitch-${characterId} 1.6s infinite` }} />
              <circle cx="80" cy="85" r="2" fill="#10b981" opacity="0.75" style={{ animation: `cipher-glitch-${characterId} 2.3s infinite` }} />
              <circle cx="50" cy="18" r="1.5" fill="#34d399" opacity="0.9" style={{ animation: `cipher-glitch-${characterId} 1.9s infinite` }} />
              <line x1="15" y1="70" x2="35" y2="70" stroke="#10b981" strokeWidth="1" strokeDasharray="2,2" opacity="0.45" />
              <line x1="65" y1="40" x2="85" y2="40" stroke="#10b981" strokeWidth="1" strokeDasharray="2,2" opacity="0.45" />
            </g>
          )}

          {characterId === 'blaze' && (
            <g id="blaze-aura" className="pointer-events-none" style={{ animation: `blaze-aura-glow-${characterId} 2s ease-in-out infinite`, transformOrigin: '50px 75px' }}>
              <circle cx="50" cy="72" r="38" fill="#f97316" opacity="0.16" filter="blur(5px)" />
              {/* Floating fire embers */}
              <circle cx="28" cy="55" r="3" fill="#ea580c" opacity="0.75" style={{ animation: `fire-flicker-${characterId} 1.4s infinite`, transformOrigin: '28px 55px' }} />
              <circle cx="72" cy="50" r="2" fill="#f97316" opacity="0.8" style={{ animation: `fire-flicker-${characterId} 1.8s infinite`, transformOrigin: '72px 50px' }} />
              <circle cx="50" cy="24" r="3" fill="#f97316" opacity="0.9" style={{ animation: `fire-flicker-${characterId} 1.1s infinite`, transformOrigin: '50px 24px' }} />
              <circle cx="38" cy="38" r="2" fill="#facc15" opacity="0.85" style={{ animation: `fire-flicker-${characterId} 1.6s infinite`, transformOrigin: '38px 38px' }} />
              <circle cx="62" cy="35" r="2.5" fill="#facc15" opacity="0.8" style={{ animation: `fire-flicker-${characterId} 1.3s infinite`, transformOrigin: '62px 35px' }} />
            </g>
          )}

          {characterId === 'frost' && (
            <g id="frost-aura" className="pointer-events-none" style={{ animation: `frost-aura-glow-${characterId} 2.5s ease-in-out infinite`, transformOrigin: '50px 75px' }}>
              <ellipse cx="50" cy="72" rx="40" ry="46" fill="#0ea5e9" opacity="0.12" filter="blur(5px)" />
              {/* Cold floating crystal shards */}
              <polygon points="20,40 24,35 22,46" fill="#7dd3fc" opacity="0.75" style={{ animation: `snow-drift-${characterId} 2.2s infinite`, transformOrigin: '22px 41px' }} />
              <polygon points="80,45 84,39 78,51" fill="#bae6fd" opacity="0.8" style={{ animation: `snow-drift-${characterId} 2.8s infinite`, transformOrigin: '80px 45px' }} />
              <polygon points="48,16 52,10 55,19" fill="#ffffff" opacity="0.9" style={{ animation: `snow-drift-${characterId} 2.4s infinite`, transformOrigin: '50px 14px' }} />
              <circle cx="25" cy="98" r="2" fill="#38bdf8" opacity="0.65" style={{ animation: `snow-drift-${characterId} 1.9s infinite` }} />
              <circle cx="75" cy="102" r="2" fill="#38bdf8" opacity="0.65" style={{ animation: `snow-drift-${characterId} 1.6s infinite` }} />
            </g>
          )}

          {characterId === 'dusk' && (
            <g id="dusk-aura" className="pointer-events-none" style={{ animation: `dusk-aura-glow-${characterId} 3.5s ease-in-out infinite`, transformOrigin: '50px 75px' }}>
              <circle cx="50" cy="72" r="42" fill="#6b21a8" opacity="0.14" filter="blur(6px)" />
              {/* Constellation starry nodes */}
              <circle cx="20" cy="38" r="2.5" fill="#faf5ff" opacity="0.95" style={{ animation: `star-twinkle-${characterId} 2s infinite` }} />
              <circle cx="78" cy="30" r="1.5" fill="#e9d5ff" opacity="0.8" style={{ animation: `star-twinkle-${characterId} 1.5s infinite` }} />
              <circle cx="16" cy="85" r="2" fill="#c084fc" opacity="0.85" style={{ animation: `star-twinkle-${characterId} 2.7s infinite` }} />
              <circle cx="84" cy="92" r="2" fill="#faf5ff" opacity="0.9" style={{ animation: `star-twinkle-${characterId} 1.8s infinite` }} />
              {/* Orbit arcs */}
              <path d="M 50,8 A 36,36 0 0,0 86,44" stroke="#a855f7" strokeWidth="1" strokeDasharray="3,3" fill="none" opacity="0.4" />
              <path d="M 50,136 A 36,36 0 0,0 14,100" stroke="#a855f7" strokeWidth="1" strokeDasharray="3,3" fill="none" opacity="0.4" />
            </g>
          )}

          {characterId === 'ember' && (
            <g id="ember-aura" className="pointer-events-none" style={{ animation: `ember-aura-glow-${characterId} 1.5s ease-in-out infinite`, transformOrigin: '50px 75px' }}>
              <circle cx="50" cy="72" r="35" fill="#f43f5e" opacity="0.15" filter="blur(4px)" />
              {/* Rapid sparks */}
              <circle cx="18" cy="58" r="2.5" fill="#fda4af" style={{ animation: `ember-sparks-${characterId} 0.8s infinite`, transformOrigin: '18px 58px' }} />
              <circle cx="82" cy="54" r="2" fill="#fb7185" style={{ animation: `ember-sparks-${characterId} 1.1s infinite`, transformOrigin: '82px 54px' }} />
              <circle cx="48" cy="18" r="3" fill="#f43f5e" style={{ animation: `ember-sparks-${characterId} 1.4s infinite`, transformOrigin: '48px 18px' }} />
              <circle cx="28" cy="98" r="2" fill="#fb7185" style={{ animation: `ember-sparks-${characterId} 0.7s infinite`, transformOrigin: '28px 98px' }} />
              <circle cx="72" cy="102" r="2.5" fill="#f43f5e" style={{ animation: `ember-sparks-${characterId} 1.2s infinite`, transformOrigin: '72px 102px' }} />
            </g>
          )}

          {characterId === 'mantis' && (
            <g id="mantis-aura" className="pointer-events-none">
              <ellipse cx="50" cy="72" rx="42" ry="46" fill="#86efac" opacity="0.10" filter="blur(5px)" />
              {/* Calming waves */}
              <circle cx="50" cy="72" r="30" fill="none" stroke="#22c55e" strokeWidth="1.2" style={{ animation: `mantis-aura-glow-${characterId} 3.5s cubic-bezier(0.4, 0, 0.2, 1) infinite` }} />
              <circle cx="50" cy="72" r="42" fill="none" stroke="#4ade80" strokeWidth="0.8" style={{ animation: `mantis-aura-glow-${characterId} 3.5s cubic-bezier(0.4, 0, 0.2, 1) infinite`, animationDelay: '1.75s' }} />
              {/* Drifting leaves */}
              <path d="M 16,42 C 14,34 22,34 16,42 Z" fill="#a7f3d0" opacity="0.8" style={{ animation: `leaf-rotate-${characterId} 2.6s infinite`, transformOrigin: '16px 42px' }} />
              <path d="M 84,48 C 82,40 90,40 84,48 Z" fill="#86efac" opacity="0.8" style={{ animation: `leaf-rotate-${characterId} 3.1s infinite`, transformOrigin: '84px 48px' }} />
              <path d="M 52,14 C 50,6 58,6 52,14 Z" fill="#22c55e" opacity="0.75" style={{ animation: `leaf-rotate-${characterId} 2.2s infinite`, transformOrigin: '52px 14px' }} />
            </g>
          )}

          {characterId === 'volt' && (
            <g id="volt-electric-aura" className="pointer-events-none" style={{ animation: `volt-aura-glow-${characterId} 1.6s ease-in-out infinite`, transformOrigin: '50px 75px' }}>
              <circle cx="50" cy="72" r="38" fill="#facc15" opacity="0.14" filter="blur(4px)" />
              {/* Electric sparking nodes */}
              <path d="M 12,50 L 17,58 L 11,66" stroke="#facc15" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none" style={{ animation: `spark-shimmer-${characterId} 1.1s ease-in-out infinite` }} />
              <path d="M 88,50 L 83,58 L 89,66" stroke="#facc15" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none" style={{ animation: `spark-shimmer-${characterId} 1.4s ease-in-out infinite` }} />
              <path d="M 50,12 L 53,4 L 47,-2" stroke="#facc15" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none" style={{ animation: `spark-shimmer-${characterId} 1.8s ease-in-out infinite` }} />
              <path d="M 28,110 L 32,118 L 26,126" stroke="#facc15" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none" style={{ animation: `spark-shimmer-${characterId} 0.9s ease-in-out infinite` }} />
              <path d="M 72,110 L 68,118 L 74,126" stroke="#facc15" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none" style={{ animation: `spark-shimmer-${characterId} 1.3s ease-in-out infinite` }} />
            </g>
          )}

          {characterId === 'monument' && (
            <g id="monument-aura" className="pointer-events-none" style={{ animation: `monument-aura-glow-${characterId} 4s ease-in-out infinite`, transformOrigin: '50px 75px' }}>
              <ellipse cx="50" cy="72" rx="42" ry="48" fill="#fef08a" opacity="0.12" filter="blur(5px)" />
              {/* Gold glint beacons */}
              <polygon points="18,35 22,31 18,27 14,31" fill="#fbbf24" stroke="#d97706" strokeWidth="0.8" style={{ animation: `gold-glint-${characterId} 3s infinite`, transformOrigin: '18px 31px' }} />
              <polygon points="82,42 86,38 82,34 78,38" fill="#fbbf24" stroke="#d97706" strokeWidth="0.8" style={{ animation: `gold-glint-${characterId} 2.2s infinite`, transformOrigin: '82px 38px' }} />
              <polygon points="50,15 53,12 50,9 47,12" fill="#fbbf24" stroke="#d97706" strokeWidth="0.8" style={{ animation: `gold-glint-${characterId} 2.6s infinite`, transformOrigin: '50px 12px' }} />
              <polygon points="12,96 15,93 12,90 9,93" fill="#ffffff" stroke="#fbbf24" strokeWidth="0.8" style={{ animation: `gold-glint-${characterId} 1.8s infinite`, transformOrigin: '12px 93px' }} />
              <polygon points="88,102 91,99 88,96 85,99" fill="#ffffff" stroke="#fbbf24" strokeWidth="0.8" style={{ animation: `gold-glint-${characterId} 3.5s infinite`, transformOrigin: '88px 99px' }} />
            </g>
          )}

          {/* Yoga / Exercise Floor Mat */}
          {(pose === 'exercising' || pose === 'yoga') && (
            <ellipse cx="50" cy="138" rx="38" ry="7" fill={colors.accent} opacity="0.4" stroke="#0a0a0a" strokeWidth="1" />
          )}

          {/* Legs - Thick Stick Figure styling */}
          {pose !== 'resting' && pose !== 'yoga' ? (
            <g>
              {/* Left Leg: thick line with outline */}
              <line x1="42" y1="110" x2="38" y2="136" stroke="#0a0a0a" strokeWidth="13" strokeLinecap="round" />
              <line x1="42" y1="110" x2="38" y2="136" stroke={colors.pants} strokeWidth="8" strokeLinecap="round" />

              {/* Right Leg: thick line with outline */}
              <line x1="58" y1="110" x2="62" y2="136" stroke="#0a0a0a" strokeWidth="13" strokeLinecap="round" />
              <line x1="58" y1="110" x2="62" y2="136" stroke={colors.pants} strokeWidth="8" strokeLinecap="round" />

              {/* If monument, let's draw red high-top shoes on top! */}
              {characterId === 'monument' && (
                <g id="monument-red-shoes-active">
                  {/* Left High-Top */}
                  <path d="M 39 122 L 34 124 L 24 131 L 23 138 Q 33 139 42 138 L 42 122 Z" fill="#ef4444" stroke="#0a0a0a" strokeWidth="2.2" strokeLinejoin="round" />
                  <path d="M 23 137 L 42 137 Q 42 140 41 141 L 24 141 Q 23 140 23 137 Z" fill="#ffffff" stroke="#0a0a0a" strokeWidth="1.2" />
                  <path d="M 23 131 C 21 133 21 136 23 137 Z" fill="#ffffff" stroke="#0a0a0a" strokeWidth="1.2" />
                  <line x1="29" y1="126" x2="33" y2="130" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" />
                  <line x1="32" y1="124" x2="36" y2="128" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" />

                  {/* Right High-Top */}
                  <path d="M 61 122 L 66 124 L 76 131 L 77 138 Q 67 139 58 138 L 58 122 Z" fill="#ef4444" stroke="#0a0a0a" strokeWidth="2.2" strokeLinejoin="round" />
                  <path d="M 77 137 L 58 137 Q 58 140 59 141 L 76 141 Q 77 140 77 137 Z" fill="#ffffff" stroke="#0a0a0a" strokeWidth="1.2" />
                  <path d="M 77 131 C 79 133 79 136 77 137 Z" fill="#ffffff" stroke="#0a0a0a" strokeWidth="1.2" />
                  <line x1="71" y1="126" x2="67" y2="130" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" />
                  <line x1="68" y1="124" x2="64" y2="128" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" />
                </g>
              )}
            </g>
          ) : (
            // Sitting resting / yoga poses
            pose === 'yoga' ? (
              <g>
                <path d="M 28 126 Q 50 142, 72 126" fill="none" stroke="#0a0a0a" strokeWidth="13" strokeLinecap="round" />
                <path d="M 28 126 Q 50 142, 72 126" fill="none" stroke={colors.pants} strokeWidth="8" strokeLinecap="round" />
              </g>
            ) : characterId === 'blaze' || characterId === 'dusk' || characterId === 'mantis' ? (
              <g>
                {/* Crossed legs for resting as thick stick-figure lines */}
                <path d="M 28 126 Q 50 140, 72 126" fill="none" stroke="#0a0a0a" strokeWidth="13" strokeLinecap="round" />
                <path d="M 28 126 Q 50 140, 72 126" fill="none" stroke={colors.pants} strokeWidth="8" strokeLinecap="round" />
              </g>
            ) : characterId === 'ember' ? (
              <g>
                {/* Dropped to one knee */}
                <path d="M 42 110 Q 30 120, 32 136" fill="none" stroke="#0a0a0a" strokeWidth="13" strokeLinecap="round" />
                <path d="M 42 110 Q 30 120, 32 136" fill="none" stroke={colors.pants} strokeWidth="8" strokeLinecap="round" />
                
                <line x1="58" y1="110" x2="58" y2="136" stroke="#0a0a0a" strokeWidth="13" strokeLinecap="round" />
                <line x1="58" y1="110" x2="58" y2="136" stroke={colors.pants} strokeWidth="8" strokeLinecap="round" />
              </g>
            ) : characterId === 'volt' ? (
              <g>
                {/* Leaning posture with legs crossed */}
                <line x1="42" y1="110" x2="35" y2="136" stroke="#0a0a0a" strokeWidth="13" strokeLinecap="round" />
                <line x1="42" y1="110" x2="35" y2="136" stroke={colors.pants} strokeWidth="8" strokeLinecap="round" />

                <line x1="58" y1="110" x2="65" y2="136" stroke="#0a0a0a" strokeWidth="13" strokeLinecap="round" />
                <line x1="58" y1="110" x2="65" y2="136" stroke={colors.pants} strokeWidth="8" strokeLinecap="round" />
              </g>
            ) : (
              // Standing resting
              <g>
                <line x1="40" y1="110" x2="38" y2="136" stroke="#0a0a0a" strokeWidth="13" strokeLinecap="round" />
                <line x1="40" y1="110" x2="38" y2="136" stroke={colors.pants} strokeWidth="8" strokeLinecap="round" />

                <line x1="60" y1="110" x2="62" y2="136" stroke="#0a0a0a" strokeWidth="13" strokeLinecap="round" />
                <line x1="60" y1="110" x2="62" y2="136" stroke={colors.pants} strokeWidth="8" strokeLinecap="round" />

                {/* If monument resting (standing resting here), render the same magnificent red shoes */}
                {characterId === 'monument' && (
                  <g id="monument-red-shoes-resting">
                    {/* Left High-Top */}
                    <path d="M 39 122 L 34 124 L 24 131 L 23 138 Q 33 139 42 138 L 42 122 Z" fill="#ef4444" stroke="#0a0a0a" strokeWidth="2.2" strokeLinejoin="round" />
                    <path d="M 23 137 L 42 137 Q 42 140 41 141 L 24 141 Q 23 140 23 137 Z" fill="#ffffff" stroke="#0a0a0a" strokeWidth="1.2" />
                    <path d="M 23 131 C 21 133 21 136 23 137 Z" fill="#ffffff" stroke="#0a0a0a" strokeWidth="1.2" />
                    <line x1="29" y1="126" x2="33" y2="130" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" />
                    <line x1="32" y1="124" x2="36" y2="128" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" />

                    {/* Right High-Top */}
                    <path d="M 61 122 L 66 124 L 76 131 L 77 138 Q 67 139 58 138 L 58 122 Z" fill="#ef4444" stroke="#0a0a0a" strokeWidth="2.2" strokeLinejoin="round" />
                    <path d="M 77 137 L 58 137 Q 58 140 59 141 L 76 141 Q 77 140 77 137 Z" fill="#ffffff" stroke="#0a0a0a" strokeWidth="1.2" />
                    <path d="M 77 131 C 79 133 79 136 77 137 Z" fill="#ffffff" stroke="#0a0a0a" strokeWidth="1.2" />
                    <line x1="71" y1="126" x2="67" y2="130" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" />
                    <line x1="68" y1="124" x2="64" y2="128" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" />
                  </g>
                )}
              </g>
            )
          )}

          {/* Torso / Spine - Aesthetic Thick Line */}
          <line x1="50" y1="52" x2="50" y2="110" stroke="#0a0a0a" strokeWidth="18" strokeLinecap="round" />
          <line x1="50" y1="52" x2="50" y2="110" stroke={colors.hoodie} strokeWidth="11" strokeLinecap="round" />

          {/* Custom Chest Geometry/Accents */}
          {renderChestGeometry()}

          {/* Head & Neck (Aesthetic thick stick head, nested glow and glossy overlay) */}
          <g style={headAnimStyle}>
            {/* Outer head outline */}
            <circle cx="50" cy="38" r="14" fill="#0a0a0a" />
            {/* Inner colored fill representing a faceless glowing space */}
            <circle cx="50" cy="38" r="9.5" fill={colors.hoodie} />
            {/* Glossy aesthetic highlight */}
            <path d="M 44.5 32 Q 50 29.5, 55.5 32 Q 50 31, 44.5 32" fill="#ffffff" opacity="0.35" />

            {/* Beautiful Astronaut Helmet overlay */}
            {hasAstronautHelmet && (
              <g id="astronaut-helmet">
                {/* Neck ring/base plate */}
                <ellipse cx="50" cy="52" rx="15" ry="3.5" fill="#94a3b8" stroke="#0a0a0a" strokeWidth="1.5" />
                <ellipse cx="50" cy="52" rx="11" ry="2" fill="#cbd5e1" />
                {/* Outer clear bubbles glass */}
                <circle cx="50" cy="35" r="21.5" fill="rgba(56, 189, 248, 0.16)" stroke="#cbd5e1" strokeWidth="1.8" />
                {/* Inner dark reflective visor */}
                <ellipse cx="50" cy="35" rx="16.5" ry="12.5" fill="rgba(15, 23, 42, 0.65)" stroke="#38bdf8" strokeWidth="1" />
                {/* Golden visor sweep highlight */}
                <path d="M 37,32 Q 50,42, 63,32" stroke="#fbbf24" strokeWidth="1.8" fill="none" opacity="0.9" />
                {/* Top glossy lens reflection reflection */}
                <path d="M 35,27 Q 50,17, 65,27 Q 50,22, 35,27" fill="#ffffff" opacity="0.7" />
                {/* Tiny side oxygen valve lights */}
                <circle cx="31.5" cy="42" r="1.5" fill="#ef4444" stroke="#0a0a0a" strokeWidth="0.5" />
                <circle cx="68.5" cy="42" r="1.5" fill="#22c55e" stroke="#0a0a0a" strokeWidth="0.5" />
              </g>
            )}
          </g>

          {/* Left Arm - Thick Stick segment */}
          <g style={leftArmStyle}>
            {pose === 'resting' && (characterId === 'cipher' || characterId === 'monument') ? (
              // Crossed arms at upper body for rest pose
              <g>
                <path d="M 36 66 Q 42 76, 54 74" fill="none" stroke="#0a0a0a" strokeWidth="11" strokeLinecap="round" />
                <path d="M 36 66 Q 42 76, 54 74" fill="none" stroke={colors.hoodie} strokeWidth="6" strokeLinecap="round" />
              </g>
            ) : (
              <g>
                {/* Arm Segment 1 and 2 with Elbow Joint */}
                <path
                  d={`M ${lShoulderX} ${lShoulderY} L ${lElbowX} ${lElbowY} L ${lHandX} ${lHandY}`}
                  fill="none"
                  stroke="#0a0a0a"
                  strokeWidth="11"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d={`M ${lShoulderX} ${lShoulderY} L ${lElbowX} ${lElbowY} L ${lHandX} ${lHandY}`}
                  fill="none"
                  stroke={colors.hoodie}
                  strokeWidth="6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                {/* Elbow Hinge Disc */}
                <circle cx={lElbowX} cy={lElbowY} r="5.5" fill="#0a0a0a" />
                <circle cx={lElbowX} cy={lElbowY} r="3" fill={colors.accent || colors.hoodie} />

                {/* Dumbbell / Glove Attachment */}
                {pose === 'exercising' && (
                  exerciseType === 'punching' ? (
                    <g>
                      {/* Red Boxing glove */}
                      <circle cx={lHandX} cy={lHandY} r="6.5" fill="#ef4444" stroke="#0a0a0a" strokeWidth="1.5" />
                      {/* Glove thumb hook */}
                      <circle cx={lHandX + 3.5} cy={lHandY + 1} r="3" fill="#ef4444" stroke="#0a0a0a" strokeWidth="1" />
                    </g>
                  ) : exerciseType === 'dumbbells' ? (
                    <g>
                      {/* Steel bar */}
                      <line x1={lHandX - 8} y1={lHandY} x2={lHandX + 8} y2={lHandY} stroke="#9ca3af" strokeWidth="3.5" strokeLinecap="round" />
                      {/* Dumbbell plates */}
                      <rect x={lHandX - 10} y={lHandY - 6} width="4" height="12" rx="1.5" fill="#374151" stroke="#0a0a0a" strokeWidth="1.2" />
                      <rect x={lHandX - 6} y={lHandY - 4} width="2" height="8" rx="1" fill="#1f2937" stroke="#0a0a0a" strokeWidth="1" />
                      
                      <rect x={lHandX + 6} y={lHandY - 6} width="4" height="12" rx="1.5" fill="#374151" stroke="#0a0a0a" strokeWidth="1.2" />
                      <rect x={lHandX + 4} y={lHandY - 4} width="2" height="8" rx="1" fill="#1f2937" stroke="#0a0a0a" strokeWidth="1" />
                    </g>
                  ) : null
                )}

                {/* Yoga Orb Glow */}
                {pose === 'yoga' && (
                  <circle cx={lHandX} cy={lHandY} r="4.5" fill={colors.accent} opacity="0.8" className="animate-pulse" stroke="#0a0a0a" strokeWidth="1" />
                )}
              </g>
            )}
          </g>

          {/* Right Arm - Thick Stick segment */}
          <g style={rightArmStyle}>
            {pose === 'resting' && (characterId === 'cipher' || characterId === 'monument') ? (
              // Crossed arms at upper body (overlapping)
              <g>
                <path d="M 64 66 Q 58 76, 46 74" fill="none" stroke="#0a0a0a" strokeWidth="11" strokeLinecap="round" />
                <path d="M 64 66 Q 58 76, 46 74" fill="none" stroke={colors.hoodie} strokeWidth="6" strokeLinecap="round" />
              </g>
            ) : (
              <g>
                {/* Arm Segment 1 and 2 with Elbow Joint */}
                <path
                  d={`M ${rShoulderX} ${rShoulderY} L ${rElbowX} ${rElbowY} L ${rHandX} ${rHandY}`}
                  fill="none"
                  stroke="#0a0a0a"
                  strokeWidth="11"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d={`M ${rShoulderX} ${rShoulderY} L ${rElbowX} ${rElbowY} L ${rHandX} ${rHandY}`}
                  fill="none"
                  stroke={colors.hoodie}
                  strokeWidth="6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                {/* Elbow Hinge Disc */}
                <circle cx={rElbowX} cy={rElbowY} r="5.5" fill="#0a0a0a" />
                <circle cx={rElbowX} cy={rElbowY} r="3" fill={colors.accent || colors.hoodie} />

                {/* Dumbbell / Glove Attachment */}
                {pose === 'exercising' && (
                  exerciseType === 'punching' ? (
                    <g>
                      {/* Red Boxing glove */}
                      <circle cx={rHandX} cy={rHandY} r="6.5" fill="#ef4444" stroke="#0a0a0a" strokeWidth="1.5" />
                      {/* Glove thumb hook */}
                      <circle cx={rHandX - 3.5} cy={rHandY + 1} r="3" fill="#ef4444" stroke="#0a0a0a" strokeWidth="1" />
                    </g>
                  ) : exerciseType === 'dumbbells' ? (
                    <g>
                      {/* Steel bar */}
                      <line x1={rHandX - 8} y1={rHandY} x2={rHandX + 8} y2={rHandY} stroke="#9ca3af" strokeWidth="3.5" strokeLinecap="round" />
                      {/* Dumbbell plates */}
                      <rect x={rHandX - 10} y={rHandY - 6} width="4" height="12" rx="1.5" fill="#374151" stroke="#0a0a0a" strokeWidth="1.2" />
                      <rect x={rHandX - 6} y={rHandY - 4} width="2" height="8" rx="1" fill="#1f2937" stroke="#0a0a0a" strokeWidth="1" />
                      
                      <rect x={rHandX + 6} y={rHandY - 6} width="4" height="12" rx="1.5" fill="#374151" stroke="#0a0a0a" strokeWidth="1.2" />
                      <rect x={rHandX + 4} y={rHandY - 4} width="2" height="8" rx="1" fill="#1f2937" stroke="#0a0a0a" strokeWidth="1" />
                    </g>
                  ) : null
                )}

                {/* Yoga Orb Glow */}
                {pose === 'yoga' && (
                  <circle cx={rHandX} cy={rHandY} r="4.5" fill={colors.accent} opacity="0.8" className="animate-pulse" stroke="#0a0a0a" strokeWidth="1" />
                )}
              </g>
            )}
          </g>
        </g>

        {/* Dynamic Punching Bag overlay matching the theme */}
        {pose === 'exercising' && exerciseType === 'punching' && (
          <g id="punching-bag" style={{ animation: `bag-swing-${characterId} 0.5s ease-in-out infinite`, transformOrigin: '82px 10px' }} overflow="visible">
            {/* Ceiling suspension wires */}
            <line x1="82" y1="10" x2="74" y2="40" stroke="#374151" strokeWidth="2.2" strokeLinecap="round" />
            <line x1="82" y1="10" x2="90" y2="40" stroke="#374151" strokeWidth="2.2" strokeLinecap="round" />
            <circle cx="82" cy="10" r="3.5" fill="#475569" stroke="#0a0a0a" strokeWidth="1.5" />

            {/* Leather heavy bag */}
            <rect x="68" y="40" width="28" height="82" rx="4" fill="#b91c1c" stroke="#0a0a0a" strokeWidth="2.2" />
            {/* S-band decor */}
            <rect x="68" y="46" width="28" height="6" fill="#1e293b" />
            <rect x="68" y="110" width="28" height="6" fill="#1e293b" />

            {/* Target Ring */}
            <circle cx="82" cy="80" r="8" fill="#ffffff" stroke="#0a0a0a" strokeWidth="1.8" />
            <circle cx="82" cy="80" r="4.5" fill="#b91c1c" />
            <circle cx="82" cy="80" r="1.8" fill="#ffffff" />
          </g>
        )}

        {/* Render a proper gorgeous desk only during working or typing animations */}
        {(pose === 'typing' || pose === 'focused') && (
          <g id="crew-desk-group" overflow="visible">
            {/* Left and Right Desk Legs */}
            <rect x="5" y="98" width="6" height="40" fill="#451a03" stroke="#0a0a0a" strokeWidth="1.5" />
            <rect x="89" y="98" width="6" height="40" fill="#451a03" stroke="#0a0a0a" strokeWidth="1.5" />
            <rect x="5" y="98" width="90" height="3" fill="#451a03" stroke="#0a0a0a" strokeWidth="1.5" />

            {/* Cozy Desk Wood Top Slab */}
            <rect x="-15" y="88" width="130" height="10" fill="#854d0e" stroke="#0a0a0a" strokeWidth="2" rx="1" />
            {/* Highlights and depth on desk face */}
            <line x1="-14" y1="91" x2="114" y2="91" stroke="#a16207" strokeWidth="1.2" />
            
            {/* Drawer line details and golden knobs */}
            <line x1="15" y1="93" x2="45" y2="93" stroke="#451a03" strokeWidth="1" />
            <circle cx="30" cy="93" r="1.5" fill="#eab308" stroke="#0a0a0a" strokeWidth="0.5" />
            <line x1="55" y1="93" x2="85" y2="93" stroke="#451a03" strokeWidth="1" />
            <circle cx="70" cy="93" r="1.5" fill="#eab308" stroke="#0a0a0a" strokeWidth="0.5" />

            {/* Computer Laptop / Workstation */}
            {/* Base block */}
            <polygon points="26,88 74,88 68,82 32,82" fill="#475569" stroke="#0a0a0a" strokeWidth="1.5" />
            {/* Screen Lid */}
            <polygon points="30,82 70,82 66,54 34,54" fill="#1e293b" stroke="#0a0a0a" strokeWidth="1.5" />
            {/* Glowing active screen bezel */}
            <polygon points="32,80 68,80 64,56 36,56" fill="#020617" />
            {/* Screen glow overlay (pulsating accent color) */}
            <polygon points="33,79 67,79 63,57 37,57" fill={colors.accent || '#22c55e'} opacity="0.18" className="animate-pulse" />
            
            {/* Dynamic pixel matrices code lines on screen */}
            <line x1="38" y1="62" x2="56" y2="62" stroke={colors.accent || '#22c55e'} strokeWidth="1.5" strokeLinecap="round" />
            <line x1="41" y1="68" x2="62" y2="68" stroke={colors.accent || '#22c55e'} strokeWidth="1.2" strokeLinecap="round" />
            <line x1="37" y1="73" x2="52" y2="73" stroke={colors.accent || '#22c55e'} strokeWidth="1.5" strokeLinecap="round" />
            <line x1="40" y1="77" x2="59" y2="77" stroke="#ffffff" strokeWidth="1" strokeLinecap="round" />

            {/* Clay pot with detailed succulent on the left */}
            <polygon points="2,88 10,88 8,80 4,80" fill="#c2410c" stroke="#0a0a0a" strokeWidth="1.2" />
            <circle cx="6" cy="76" r="3.5" fill="#15803d" stroke="#0a0a0a" strokeWidth="1.2" />
            <circle cx="6" cy="72" r="1.2" fill="#ec4899" />

            {/* Ceramic steamed beverage mug on the right */}
            <rect x="90" y="76" width="7" height="12" fill="#fafaf9" stroke="#0a0a0a" strokeWidth="1.2" rx="1" />
            <path d="M 97,79 C 100,79 100,85 97,85" fill="none" stroke="#0a0a0a" strokeWidth="1.2" />
            <ellipse cx="93.5" cy="77.5" rx="2" ry="0.6" fill="#78350f" />
            {/* Steam rising path */}
            <path d="M 93.5,72 Q 94.5,67, 92.5,62 T 93.5,54" fill="none" stroke={colors.accent || '#22c55e'} strokeWidth="0.8" className="animate-pulse" />
          </g>
        )}
      </svg>

      {/* Confetti overlay if celebrating challenge complete */}
      {(pose === 'challenge-complete' || (pose === 'celebrating' && Math.random() < 0.3)) && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="flex justify-center space-x-1 w-full h-full opacity-80 scale-105">
            {[...Array(12)].map((_, i) => {
              const shapes = ['rounded-full', 'w-2 h-2', 'w-1.5 h-3 rotate-45'];
              const chosenShape = shapes[i % shapes.length];
              const offsets = ['-translate-y-2', '-translate-y-4', '-translate-y-6', '-translate-y-8'];
              const floatDelay = `${i * 0.1}s`;
              return (
                <div
                  key={i}
                  className={`bg-[#22c55e] ${chosenShape} animate-bounce`}
                  style={{
                    animationDelay: floatDelay,
                    animationDuration: '1s',
                    opacity: 0.8,
                  }}
                />
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
export default CrewCharacter;
