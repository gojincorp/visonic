# ib_visonic TYPO3 extension

ib_visonic extension to help customize TYPO3 integration of Visonic Monitoring tool

## Installation

If you are reading this README file then you have already unzipped the installation package.  More to come...

```bash
cd typo3conf/ext/ib_visonic
```

## Run Demo

TBD

```bash
TBD
```

## Run Unit Tests

There are current no test cases.

```bash
TBD
```

## Usage


```javascript
TBD
```

## Developer Notes

Modifcations from default Extension Builder bootstrap project:

./README.md => New file<br>
./ext_tables.php => Relocate call to addStaticFile() to ./Configuration/TCA/Overrides/sys_template.php<br>
./Configuration/TCA/Overrides/pages.php => New file to call registerPageTSConfigFile()<br>
./Configuration/TCA/Overrides/sys_template.php => New file to call addStaticFile()<br>
./Configuration/PageTS/Mod/All.txt => New file used as master include file for subdirectory resouces
./Configuration/PageTS/Mod/WebLayout/BackendLayouts/default.txt => New file to define backend layouts<br>
./Configuration/PageTS/Mod/WebLayout/BackendLayouts/default.txt => New file to define backend layouts<br>
./Configuration/PageTS/Mod/WebLayout/BackendLayouts.txt => New file to configure inclusion of backend layouts<br>
./Configuration/TypoScript/constants.typoscript => New file used for static constants<br>
./Configuration/TypoScript/setup.typoscript => New file used for static setup<br>
./Resources/Public/Images/BackendLayouts/<file_name> => New directory for backend layout thumbnail images<br>
./Resources/Private/Language/locallang_be.xlf => New file for backend layout labels<br>
./Resources/Private/Layouts/Page => New directory for page layouts<br>
./Resources/Private/Templates/Page => New directory for page templates<br>