CREATE DATABASE IF NOT EXISTS `test`;
CREATE TABLE  IF NOT EXISTS `test`.`test` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(32) DEFAULT NULL,
  `version` int(11) DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
TRUNCATE TABLE `test`.`test`;
INSERT INTO `test`.`test` (`id`,`name`,`version`) VALUES (1,"test:1",1);