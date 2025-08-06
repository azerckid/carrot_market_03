"use server";

const MAX_FILE_SIZE = 1 * 1024 * 1024; // 1MB

export async function uploadProduct(
  prevState: { error?: string } | null,
  formData: FormData
) {
  const photo = formData.get("photo");

  // 파일 타입 검증
  if (photo instanceof File) {
    // 이미지 파일 타입 검증
    if (!photo.type.startsWith("image/")) {
      return {
        error: "이미지 파일만 업로드 가능합니다.",
      };
    }

    // 파일 크기 검증
    if (photo.size > MAX_FILE_SIZE) {
      return {
        error: "파일 크기는 최대 1MB까지 가능합니다.",
      };
    }
  }

  const data = {
    photo: photo,
    title: formData.get("title"),
    price: formData.get("price"),
    description: formData.get("description"),
  };
  console.log(data);

  return null;
}

