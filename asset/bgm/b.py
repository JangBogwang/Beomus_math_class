from pydub import AudioSegment

input_path = "stage44.mp3"
output_path = "stage4.mp3"

# MP3 불러오기
audio = AudioSegment.from_file(input_path, format="mp3")

# 64초 = 64000ms
end_ms = 64 * 1000

# 0~64초 구간 잘라내기
trimmed = audio[:end_ms]

# MP3로 저장
trimmed.export(output_path, format="mp3")

print("완료! 저장된 파일:", output_path)
