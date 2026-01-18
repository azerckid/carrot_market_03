#!/bin/bash
# Prisma 스키마를 Turso(LibSQL) 데이터베이스에 동기화하는 스크립트

echo "🚧 1. Prisma 클라이언트 생성..."
npx prisma generate

echo "🚧 2. 마이그레이션 SQL 생성 중..."
# --to-schema-datamodel 옵션이 --to-schema로 변경되었습니다.
npx prisma migrate diff --from-empty --to-schema prisma/schema.prisma --script > migration.sql

if [ ! -s migration.sql ]; then
  echo "❌ Error: 마이그레이션 SQL 파일이 비어있습니다. Prisma 설정을 확인해주세요."
  rm migration.sql
  exit 1
fi

echo "📄 생성된 SQL 미리보기 (상위 5줄):"
head -n 5 migration.sql

echo "🚧 3. SQL을 Turso DB에 적용 중..."
# turso db shell은 표준 입력으로 SQL을 받습니다.
turso db shell carrot-market-db < migration.sql

if [ $? -eq 0 ]; then
    echo "✅ 마이그레이션 완료! (migration.sql 파일은 삭제됩니다)"
    rm migration.sql
else
    echo "❌ Turso DB 적용 실패."
    exit 1
fi
