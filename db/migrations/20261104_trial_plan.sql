-- 체험(무상) 사용 단계 도입: 기관 이용 상태, 체험 기간·인원 상한, 기관 확인, 관리자 이메일 인증
-- 기존 기관은 모두 'active'(제한 없음), 기존 관리자는 모두 인증 완료로 처리한다.
SET NAMES utf8mb4;

ALTER TABLE organizations
  ADD COLUMN plan_status   ENUM('trial','active','suspended') NOT NULL DEFAULT 'active' AFTER default_interval_hours,
  ADD COLUMN trial_ends_at DATETIME NULL COMMENT '체험 종료 시각 (이메일 인증 시점부터 계산)' AFTER plan_status,
  ADD COLUMN user_limit    INT UNSIGNED NULL COMMENT '대상자 상한 (NULL = 제한 없음)' AFTER trial_ends_at,
  ADD COLUMN verified_at   DATETIME NULL COMMENT '기관 확인 시각 (공공 도메인 자동 또는 운영사 확인)' AFTER user_limit;

UPDATE organizations SET verified_at = created_at WHERE verified_at IS NULL;

ALTER TABLE admins
  ADD COLUMN email_verified_at DATETIME NULL AFTER email;

UPDATE admins SET email_verified_at = created_at WHERE email_verified_at IS NULL;

CREATE TABLE IF NOT EXISTS email_verification_tokens (
  id         INT NOT NULL AUTO_INCREMENT,
  admin_id   BIGINT UNSIGNED NOT NULL,
  token      VARCHAR(64) NOT NULL,
  expires_at DATETIME NOT NULL,
  used_flag  TINYINT NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_token (token),
  KEY idx_admin_id (admin_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='가입 이메일 인증 토큰 (24시간 유효)';
