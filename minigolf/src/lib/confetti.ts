// Simple confetti effect
export default function confetti() {
  const colors = ['#FF6B6B', '#4ECDC4', '#FFE66D', '#A855F7', '#F97316', '#10B981'];
  const confettiCount = 150;
  
  for (let i = 0; i < confettiCount; i++) {
    createConfettiPiece(colors[Math.floor(Math.random() * colors.length)], i * 20);
  }
}

function createConfettiPiece(color: string, delay: number) {
  const confetti = document.createElement('div');
  confetti.style.cssText = `
    position: fixed;
    width: ${Math.random() * 10 + 5}px;
    height: ${Math.random() * 10 + 5}px;
    background: ${color};
    left: ${Math.random() * 100}vw;
    top: -20px;
    opacity: 1;
    border-radius: ${Math.random() > 0.5 ? '50%' : '0'};
    pointer-events: none;
    z-index: 9999;
    animation: confetti-fall ${Math.random() * 3 + 2}s ease-out forwards;
    animation-delay: ${delay}ms;
    transform: rotate(${Math.random() * 360}deg);
  `;
  
  document.body.appendChild(confetti);
  
  // Create the animation
  if (!document.getElementById('confetti-style')) {
    const style = document.createElement('style');
    style.id = 'confetti-style';
    style.textContent = `
      @keyframes confetti-fall {
        0% {
          transform: translateY(0) rotate(0deg);
          opacity: 1;
        }
        100% {
          transform: translateY(100vh) rotate(720deg);
          opacity: 0;
        }
      }
    `;
    document.head.appendChild(style);
  }
  
  // Remove after animation
  setTimeout(() => {
    confetti.remove();
  }, 5000 + delay);
}
