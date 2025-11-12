from pydub import AudioSegment

# === 설정 ===
input_path = "stage33.mp3"      # 원본 파일 경로
output_path = "stage3.mp3"  # 결과 파일 경로
target_duration_ms = 60 * 1000      # 앞부분 1분(60초)
target_sample_rate = 16000          # 낮은 샘플링(기본 44.1kHz → 16kHz)
target_bitrate = "64k"              # 비트레이트 64kbps (용량 절감)
target_channels = 1                 # 모노(1채널)

# === 오디오 읽기 ===
audio = AudioSegment.from_file(input_path)

# === 1분만 자르기 ===
audio_trimmed = audio[:target_duration_ms]

# === 샘플링 주파수/채널 조정 ===
audio_processed = (
    audio_trimmed
    .set_frame_rate(target_sample_rate)
    .set_channels(target_channels)
)

# === 압축 저장 ===
audio_processed.export(
    output_path,
    format="mp3",
    bitrate=target_bitrate
)

print(f"✅ 변환 완료: {output_path}")
