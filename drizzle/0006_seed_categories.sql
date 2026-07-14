INSERT INTO `categories` (`name`, `description`)
SELECT t.`name`, t.`description` FROM (
	SELECT '学生生活' AS `name`, 'キャンパスライフ、施設、サービスに関する意見' AS `description`
	UNION ALL SELECT '授業・カリキュラム', '授業内容、教育方法、カリキュラムに関する意見'
	UNION ALL SELECT '課外活動', 'サークル、イベント、ボランティアに関する意見'
	UNION ALL SELECT 'キャリア・就職', '就職支援、インターンシップに関する意見'
	UNION ALL SELECT 'その他', 'その他の意見・提案'
) t
WHERE NOT EXISTS (SELECT 1 FROM `categories`);