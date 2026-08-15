import sys
import math
import struct

# Dimensions
WIDTH = 1080
HEIGHT = 1920
FPS = 30
DURATION = 6  # 6 seconds
TOTAL_FRAMES = FPS * DURATION

def make_frame(frame_idx):
    # Progress (0.0 to 1.0)
    progress = frame_idx / TOTAL_FRAMES
    
    # Breathing factor
    pulse = math.sin(progress * math.pi * 4) * 0.5 + 0.5  # 2 cycles
    
    # Initialize bytearray for RGB24
    # We will write row-by-row
    frame_data = bytearray(WIDTH * HEIGHT * 3)
    idx = 0
    
    # Particle positions (drifting upwards)
    particles = []
    for i in range(15):
        # Deterministic particles based on index i
        px = int((math.sin(i * 1234.56 + progress * 2) * 0.45 + 0.5) * WIDTH)
        py = int(((i * 777.7 + progress * 300) % HEIGHT))
        # Particle size and brightness
        size = int(3 + (i % 4))
        brightness = int(150 + 105 * math.sin(progress * math.pi * 2 + i))
        particles.append((px, py, size, brightness))

    for y in range(HEIGHT):
        # Precompute vertical background gradient
        # From very deep blue at the top to rich dark indigo/violet at the bottom
        vy = y / HEIGHT
        r_bg = int(6 + vy * 12)
        g_bg = int(8 + vy * 14)
        b_bg = int(22 + vy * 38)
        
        # Grid line visibility (draw horizontal lines every 120px)
        grid_h = 1 if (y + int(progress * 150)) % 120 < 2 else 0
        
        for x in range(WIDTH):
            vx = x / WIDTH
            # Draw grid vertical lines every 120px
            grid_w = 1 if x % 120 < 2 else 0
            
            # Combine background and grid
            r = r_bg
            g = g_bg
            b = b_bg
            
            if grid_h or grid_w:
                # Indigo glow grid
                r = min(255, r + 20)
                g = min(255, g + 30)
                b = min(255, b + 90)
            
            # 1. Pulsating Golden Orb in the center
            cx, cy = WIDTH // 2, HEIGHT // 2
            dx = x - cx
            dy = y - cy
            dist = math.sqrt(dx*dx + dy*dy)
            
            # Glowing radius (breathing between 120 and 200px)
            orb_radius = 140 + pulse * 40
            
            if dist < orb_radius * 2.5:
                # Soft glow radial falloff
                glow = (1.0 - (dist / (orb_radius * 2.5))) ** 2
                # Golden color: R=255, G=190, B=40
                r = min(255, int(r + glow * 255))
                g = min(255, int(g + glow * 180))
                b = min(255, int(b + glow * 40))
                
                # Inner solid core
                if dist < orb_radius * 0.4:
                    core = 1.0 - (dist / (orb_radius * 0.4))
                    r = min(255, int(r + core * 50))
                    g = min(255, int(g + core * 75))
                    b = min(255, int(b + core * 215)) # golden-cyan core
            
            # 2. Tech Scanner line sweeping down
            scan_y = int(progress * HEIGHT * 1.5) % HEIGHT
            scan_dist = abs(y - scan_y)
            if scan_dist < 40:
                scan_glow = (1.0 - (scan_dist / 40.0)) ** 1.5
                # Cyan/neon blue line
                r = min(255, int(r + scan_glow * 20))
                g = min(255, int(g + scan_glow * 150))
                b = min(255, int(b + scan_glow * 255))

            # 3. Drifting glowing particles
            for px, py, p_size, p_bright in particles:
                p_dist_sq = (x - px)**2 + (y - py)**2
                if p_dist_sq < p_size * p_size:
                    # Particle center
                    r = min(255, r + p_bright)
                    g = min(255, g + int(p_bright * 0.8))
                    b = min(255, b + int(p_bright * 0.3))
                elif p_dist_sq < p_size * p_size * 4:
                    # Particle halo
                    halo = (1.0 - (math.sqrt(p_dist_sq) / (p_size * 2))) * 0.5
                    r = min(255, r + int(p_bright * halo))
                    g = min(255, g + int(p_bright * 0.8 * halo))
                    b = min(255, b + int(p_bright * 0.3 * halo))

            # Write RGB
            frame_data[idx] = r
            frame_data[idx+1] = g
            frame_data[idx+2] = b
            idx += 3
            
    sys.stdout.buffer.write(frame_data)

if __name__ == "__main__":
    for f in range(TOTAL_FRAMES):
        make_frame(f)
