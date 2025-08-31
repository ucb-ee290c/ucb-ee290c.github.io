---
title: Setting up Software and Accounts for Bringup
layout: default
nav_order: 2
---

## Access Checklist

Below is a checklist for access to accounts and resources. Please make sure you have completed this checklist 

- [ ] Completed BWRC Forms DocuSign in an email titled "\*\*Action Required\*\* Complete BWRC Forms"
- [ ] Received IRIS account login in an email titled "IRIS Account request for FirstName LastName" and verified it via IRIS Self-Serve website
- [ ] If accessing previous semester tapeout material or simulating chip standard cells, sign Intel NDA.

## Setting up Berkeley VPN

To access the BWRC GitLab repository and establish a remote connection to the BWRC remote machines, you need to be connect to the berkeley VPN. The only exception is when you are physically connected to the network via a wired Ethernet connection in BWRC. 

[bSecure VPN Homepage](https://security.berkeley.edu/services/bsecure/bsecure-remote-access-vpn%20)

First download GlobalProtect Software for your machine (32/64-bit Mac and 32/64-bit Windows---for other OS'es see bSecure Homepage above) from [vpn.berkeley.edu](https://vpn.berkeley.edu/global-protect/getsoftwarepage.esp)

**Note:** If you have an ARM64 machine use [this GlobalProtect installer](https://nuwildcat.sharepoint.com/:u:/r/teams/gl_nuit_tss-EndpointDeviceManagement/Shared%20Documents/EDM%20Enterprise%20Services/Software%20Repository/GlobalProtect/Windows/ARM%2064/GlobalProtectARM64-6.2.8-c263.msi?csf=1&web=1&e=Vsbt0n) instead

## Testing IRIS account

To access both the BWRC GitLab repository and establish a remote connection to the BWRC remote machines, you need an active IRIS account. To test your IRIS account use [this tool](https://iris2.eecs.berkeley.edu/selfserve/testldap/) from the IRIS self-serve website

If you have forgotten/wish to change your password, you can recover/change it [here](https://iris2.eecs.berkeley.edu/selfserve/adpasswd/) (Click on 'Email' if you have forgotten your password and wish to receive a recovery link via email)

## Chipyard+Baremetal IDE access and RISC-V Toolchain

RISC-V 64 bit toolchains is by default available on BWRC machines. Chipyard and BaremetalIDE repositories will be cloned onto your account on the BWRC machines. You should not have to clone these repositories or build the RISC-V Toolchain locally on your machine.

## Altium Setup

### Creating Your Altium Account

First, create a Altium Student Lab account [here](https://www.altium.com/education/students#). Use your berkeley email address.
**Note:** It might take a day or two to get a response after you fill out the form on the website.

### Downloading Altium Designer

Once you have created your student lab account, [download Altium Designer](https://www.altium.com/products/downloads). Make sure you are signed into your student account (look at the top right of the page and you should see your google account icon).

Make sure PCB Design, Platform Extensions, and Importers/Exporters are all selected.

You can download Altium to the default Application Path.

Once the installation is complete, open Altium (Should take 1-2 minutes)

### Opening Altium 

When you first open Altium, you may be prompted to Import old settings, skip it. You will be prompted to sign in to your account. Click sign-in and a webpage will open up in your default browser where you can sign in to your Altium account.

Upon boot and after signing in, the License Management page will open up. Select an active license and click 'Use'.

**Note:** If there is no active license, double check that you are signed in to your account and that Altium’s online profile setting shows this.

Once you have create an account, we will add you the the 'UC Berkeley - EE194' 365 Workspace. You can connect to the 365 Workspace in the app by clicking the 365 Workspace tab in the top right corner (Cloud Icon) and selecting the EE194 workspace. 

Finally, we want to install the required extensions. Click your account profile (Person Icon) in the upper right hand corner and then 'Updates and Extensions' 

Under the 'Available' tab, install the following extensions:
- ActiveRoute
- Draftsman
- Ansys CoDesigner
- Power Analyzer by Keysight
- LTSpice Importer
- Signal Integrity Analysis
- Mixed Simulation

**Note:** This is the page you can also use to install Altium Updates under the 'Updates' tab.

For ease of creating new components I recommend adding the [SamacSys Library Loader Extension](https://www.samacsys.com/altium-designer-library-instructions/) to your Altium, but it is not required.






