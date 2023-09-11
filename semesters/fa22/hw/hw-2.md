---
layout: default
title: Fa22 Bringup
---

# HW 2

## Introduction

First, fill out this form to indicate your experience/interests in this material: https://forms.gle/3gb2CYGB9saSujPz6. **Do this by Monday, September 19 at 9:00am.**

For this assignment, you will be going through lots of documentation and trying to get a sense of where to start in the chip bringup process.

Throughout this assignment, there are **bolded questions** to which you should write some brief responses to and submit on bCourses by **Wednesday, September 21 at 9:00am** (before class).

Things to keep in mind:

- There are LOTS of files involved. This is simply from trying to document all steps of the chip design and testing, so it is inherent to a chip bringup process and can definitely be daunting. Sad to say, more is better than less so that there is no information loss. So it is normal to be overwhelmed!

- You will never feel like you have the whole picture! You are inheriting these chips from another class, and will never have access to all the information they had while designing the chip (even if you were involved in the design of that chip). Become comfortable with abstracting away certain details, but do make a note of information that is missing that we should ask the chip designers.

- On that note, ***add comments to any of the google docs you read through if something is unclear/seems incorrect.*** We need to keep track of what information is missing in order to understand these chips and test them.

## Chip Spec

Read through the [OsciBear Spec](https://docs.google.com/document/d/10uwl_-CENBxfJ_ImlIpCOv1I7NRhQ8Hcbgg7V-u7BpE/edit?usp=sharing). In particular, look at the block diagram in section 2. *Functional Description* and the I/Os in section 2.0. *Chip-Level I/O*. **What kind of pins/information can you see are exposed to the outside world that could be tested immediately?** Think in terms of power delivery, I/O polarity, etc. **What kind of things CANNOT be tested?** (i.e. things that rely on a test PCB, booting the core, etc.). 

## Initial "smoke testing"

Now skim through the first bringup [design review on 12/1/2021](https://docs.google.com/presentation/d/1KymkU8tKulxSDoUpuweISg_AbTvKxfqzv6RSfXOryTY/edit?usp=sharing) that was conducted after ~2 months of having the OsciBear chips back.  All we had initially was the packaged chips (slide 3 shows the bare die with the "ee290c spring 2021" logo we drew onto the chip).  We soldered these packaged chips onto a breakout board we purchased that was made for the QFN48 chip footprint, which allowed us to run some initial "smoke" tests to check for shorts, see slide 4.

For the smoke testing process, look at the [initial Power Up Notes](https://docs.google.com/document/d/1KYSjdGWSFuDZxZvCflh7EnQ_03_1wnP-xUctJqhpxwQ/edit?usp=sharing). **Summarize what the power up steps are doing, referencing the chip block diagram from the OsciBear Spec.** It would help to be familiar with what an LDO (low dropout) regulator is, google it if you are unsure.

## PCB

Look through initial [OsciBear bringup plan](https://docs.google.com/presentation/d/1Gs47-yamfl0baSdKDYVHiiUFpn6sJ_40/edit?usp=sharing&ouid=101719282076225449124&rtpof=true&sd=true) (useful info starts at slide 14). This is the format we were expected to write our bringup plan for the OsciBear chip. **Summarize some of your general comments about the Steps in Testing (slides 22-27).**

A few months after writing this initial test plan, we had a PCB schematic and layout that we shipped out to get manufactured. Look through the [OsciBear PCB Schematic]((https://drive.google.com/file/d/1LTJZ4nYAWx7QoTrBjxlKNDqR4id7Ls6m/view)), and the associated [PCB Test Plan](https://docs.google.com/document/d/1tQ3RLD4XybyNW1Y-uKpsSqgMtGZKb2ivfOpA7K6OlVw/edit?usp=sharing) for testing this PCB. We will redo this test plan on the PCBs in class. **What do the different voltage values at T7, T1, and T2 correspond to in the PCB? What is the purpose of each of these different voltage levels present on the PCB (or give your best guess)?**