const MICRO_WORLD_RULES = Object.freeze([
  "In the Lanor Grid, a gate controls one whole lane.",
  "A relay feeds every pod linked to it.",
  "A hush fault affects one pod only."
]);

export const probeBestExplanationTemplateIds = Object.freeze([
  "visible_symptom_vs_underlying_cause",
  "shared_source_vs_local_fault",
  "broken_dependency_missing_prerequisite",
  "late_discriminating_clue"
]);

export const probeBestNextCheckTemplateIds = Object.freeze([
  "two_live_explanations_one_separator",
  "tempting_low_value_vs_high_value_probe",
  "shared_downstream_symptom_vs_upstream_check",
  "broad_check_vs_narrow_decisive_probe"
]);

export const probeScenarioBundles = Object.freeze([
  {
    id: "printer_cluster",
    templateBias: ["visible_symptom_vs_underlying_cause", "shared_source_vs_local_fault", "late_discriminating_clue"],
    realWorld: {
      title: "East wing printers",
      clueBits: {
        symptom: "Three desks in the east wing stopped printing within two minutes.",
        spread: "The hallway copier light is normal, but nearby desks all fail together.",
        localCheck: "One printer tray was refilled this morning.",
        upstreamIndicator: "The east network switch alarm is on.",
        dependencyGap: "Jobs sent from the east desks never reach the queue.",
        lateDiscriminator: "A badge scanner on the same east switch also stopped syncing.",
        negativeEvidence: "Printers on the west wing still print normally.",
        timingCue: "The failures started exactly when the switch alarm was logged."
      },
      explanations: {
        correct: "The east wing network switch lost power.",
        localLure: "One printer has a paper-feed jam.",
        partialLure: "The copier driver on one desk is outdated.",
        broadLure: "The whole company print service is slow."
      },
      checks: {
        correct: "Check whether the east network switch is powered and forwarding traffic.",
        local: "Open the front printer tray and look for a jam.",
        broad: "Reload the print dashboard for the whole office.",
        redundant: "Ask one east desk to send the same job again."
      }
    },
    microWorld: {
      title: "Kel lane pods",
      ontologyId: "lanor_grid",
      rules: MICRO_WORLD_RULES,
      clueBits: {
        symptom: "Three pods on Lane Kel dimmed within two beats.",
        spread: "The front pod lens is clear, but every Kel pod fades together.",
        localCheck: "One pod shell was polished this morning.",
        upstreamIndicator: "The Kel gate marker is dark.",
        dependencyGap: "Signals from Kel never reach the queue board.",
        lateDiscriminator: "A hand scanner tied to Kel also stopped syncing.",
        negativeEvidence: "Pods on Lane Mer still pulse normally.",
        timingCue: "The dimming started at the same beat the Kel gate went dark."
      },
      explanations: {
        correct: "The Kel gate lost power.",
        localLure: "One front pod lens is blocked.",
        partialLure: "One console still holds an old route map.",
        broadLure: "The whole grid pulse is slow."
      },
      checks: {
        correct: "Check whether the Kel gate still has power and is passing signal.",
        local: "Inspect the front pod lens for dust.",
        broad: "Refresh the full grid pulse board.",
        redundant: "Resend the same pod pulse from one Kel console."
      }
    }
  },
  {
    id: "cold_chain",
    templateBias: ["visible_symptom_vs_underlying_cause", "broken_dependency_missing_prerequisite", "shared_source_vs_local_fault"],
    realWorld: {
      title: "Cold room shelf",
      clueBits: {
        symptom: "Milk on Shelf C keeps warming even though the room fan is running.",
        spread: "Products on two nearby Shelf C racks warmed together.",
        localCheck: "One carton cap was left loose earlier.",
        upstreamIndicator: "The coolant branch valve for Shelf C is closed.",
        dependencyGap: "Cold flow never reaches the Shelf C loop.",
        lateDiscriminator: "The floor pipe beyond the Shelf C valve stays warm.",
        negativeEvidence: "Shelves A and B are still at target temperature.",
        timingCue: "The warming began right after the branch valve was serviced."
      },
      explanations: {
        correct: "The Shelf C coolant branch is not opening.",
        localLure: "One milk carton was left uncapped.",
        partialLure: "The room fan is too weak.",
        broadLure: "The whole cold room lost cooling."
      },
      checks: {
        correct: "Check whether the Shelf C coolant branch valve is opening and passing flow.",
        local: "Inspect one loose milk carton cap.",
        broad: "Read the full cold room thermostat again.",
        redundant: "Move one warm carton to the front of the same shelf."
      }
    },
    microWorld: {
      title: "Ner coolant branch",
      ontologyId: "lanor_grid",
      rules: MICRO_WORLD_RULES,
      clueBits: {
        symptom: "Pods on Branch Ner keep warming even though the room fan spins.",
        spread: "Two nearby Ner racks warmed together.",
        localCheck: "One pod cap sat loose earlier.",
        upstreamIndicator: "The Ner flow gate is closed.",
        dependencyGap: "Cold stream never reaches the Ner loop.",
        lateDiscriminator: "The floor pipe beyond the Ner gate stays warm.",
        negativeEvidence: "Branches Tal and Mer remain cold.",
        timingCue: "The warming began right after the Ner gate was serviced."
      },
      explanations: {
        correct: "The Ner flow gate is not opening.",
        localLure: "One pod cap was left loose.",
        partialLure: "The room fan is too weak.",
        broadLure: "The whole chamber lost cooling."
      },
      checks: {
        correct: "Check whether the Ner flow gate is opening and passing stream.",
        local: "Inspect the loose pod cap.",
        broad: "Read the whole chamber thermostat again.",
        redundant: "Move one warm pod to the front of the same rack."
      }
    }
  },
  {
    id: "conveyor_scan",
    templateBias: ["shared_source_vs_local_fault", "late_discriminating_clue", "two_live_explanations_one_separator"],
    realWorld: {
      title: "Bay C conveyor",
      clueBits: {
        symptom: "Parcels on Bay C stop updating after they cross the same scanner arch.",
        spread: "Handheld scans on Bay C also fail after the arch.",
        localCheck: "One parcel label looked crumpled.",
        upstreamIndicator: "The Bay C hub light is off.",
        dependencyGap: "Events disappear before they reach the routing board.",
        lateDiscriminator: "Parcels scanned on Bay D update normally at the same time.",
        negativeEvidence: "Only Bay C misses updates.",
        timingCue: "The misses began just after the Bay C hub reboot alert."
      },
      explanations: {
        correct: "The Bay C hub is offline.",
        localLure: "One scanner arch lens is dirty.",
        partialLure: "Several parcel labels are damaged.",
        broadLure: "The routing board is slow everywhere."
      },
      checks: {
        correct: "Check whether the Bay C hub is online and passing events.",
        local: "Clean the scanner arch lens and rerun one parcel.",
        broad: "Refresh the routing board for every bay.",
        redundant: "Scan another parcel through the same arch."
      }
    },
    microWorld: {
      title: "Lane Sor relay",
      ontologyId: "lanor_grid",
      rules: MICRO_WORLD_RULES,
      clueBits: {
        symptom: "Pods on Lane Sor stop updating after the same relay arch.",
        spread: "Hand scanners on Sor also fail after the arch.",
        localCheck: "One token tag looked bent.",
        upstreamIndicator: "The Sor relay light is dark.",
        dependencyGap: "Events vanish before they reach the routing board.",
        lateDiscriminator: "Lane Tal updates normally at the same beat.",
        negativeEvidence: "Only Sor misses updates.",
        timingCue: "The misses began just after the Sor relay reboot tone."
      },
      explanations: {
        correct: "The Sor relay is offline.",
        localLure: "One relay arch lens is dusty.",
        partialLure: "Several token tags are bent.",
        broadLure: "The routing board is slow everywhere."
      },
      checks: {
        correct: "Check whether the Sor relay is online and passing events.",
        local: "Clean the relay arch lens and rerun one token.",
        broad: "Refresh the routing board for every lane.",
        redundant: "Scan another token through the same arch."
      }
    }
  },
  {
    id: "release_pipeline",
    templateBias: ["broken_dependency_missing_prerequisite", "late_discriminating_clue", "broad_check_vs_narrow_decisive_probe"],
    realWorld: {
      title: "Night release build",
      clueBits: {
        symptom: "The release package never appears even though the compile step finishes.",
        spread: "Every job waiting on the sign-off stage is stalled.",
        localCheck: "One engineer renamed a file in the build script.",
        upstreamIndicator: "The approval token for the release lane was never issued.",
        dependencyGap: "Artifacts cannot publish before the sign-off token exists.",
        lateDiscriminator: "Manual compiles succeed, but auto-publish still never starts.",
        negativeEvidence: "Earlier packages on other lanes published on time.",
        timingCue: "The stall began after the approval service key rotated."
      },
      explanations: {
        correct: "The release sign-off token is missing.",
        localLure: "One build script filename is wrong.",
        partialLure: "The compile servers are overloaded.",
        broadLure: "The whole delivery platform is down."
      },
      checks: {
        correct: "Check whether the release sign-off token was issued for this lane.",
        local: "Review the renamed build script file.",
        broad: "Ping the whole delivery platform again.",
        redundant: "Rerun the compile step on the same code."
      }
    },
    microWorld: {
      title: "Forge lane token",
      ontologyId: "lanor_grid",
      rules: MICRO_WORLD_RULES,
      clueBits: {
        symptom: "The forge package never appears even though the compile gate clears.",
        spread: "Every job waiting on the seal stage is stalled.",
        localCheck: "One operator renamed a script rune.",
        upstreamIndicator: "The lane seal token for Forge was never issued.",
        dependencyGap: "Bundles cannot publish before the seal token exists.",
        lateDiscriminator: "Manual compiles succeed, but auto-publish never starts.",
        negativeEvidence: "Other lanes published on time.",
        timingCue: "The stall began after the seal service key rotated."
      },
      explanations: {
        correct: "The Forge seal token is missing.",
        localLure: "One script rune name is wrong.",
        partialLure: "The compile gates are overloaded.",
        broadLure: "The whole delivery board is down."
      },
      checks: {
        correct: "Check whether the Forge seal token was issued for this lane.",
        local: "Review the renamed script rune.",
        broad: "Ping the whole delivery board again.",
        redundant: "Rerun the same compile step."
      }
    }
  },
  {
    id: "water_loop",
    templateBias: ["visible_symptom_vs_underlying_cause", "shared_downstream_symptom_vs_upstream_check", "late_discriminating_clue"],
    realWorld: {
      title: "Lab wash loop",
      clueBits: {
        symptom: "Two sinks on the same wash loop lost warm water together.",
        spread: "The pump hum is audible, but both sinks stay cold.",
        localCheck: "One faucet head was changed yesterday.",
        upstreamIndicator: "The mixer valve indicator is stuck closed.",
        dependencyGap: "Warm water cannot reach the loop before the mixer valve opens.",
        lateDiscriminator: "Cold water pressure at both sinks is still normal.",
        negativeEvidence: "Sinks on the other loop still have warm water.",
        timingCue: "The issue began after the mixer valve inspection."
      },
      explanations: {
        correct: "The loop mixer valve is stuck closed.",
        localLure: "One faucet head is blocked.",
        partialLure: "The pump is weak.",
        broadLure: "The building lost hot water."
      },
      checks: {
        correct: "Check whether the mixer valve is opening for the affected loop.",
        local: "Remove one faucet head and inspect it for scale.",
        broad: "Ask if the whole building has hot water.",
        redundant: "Run one sink again for another minute."
      }
    },
    microWorld: {
      title: "Wash loop Leth",
      ontologyId: "lanor_grid",
      rules: MICRO_WORLD_RULES,
      clueBits: {
        symptom: "Two taps on Loop Leth lost warm stream together.",
        spread: "The pump hum is audible, but both taps stay cold.",
        localCheck: "One tap head was changed yesterday.",
        upstreamIndicator: "The Leth mixer marker is stuck closed.",
        dependencyGap: "Warm stream cannot reach the loop before the mixer opens.",
        lateDiscriminator: "Cold stream at both taps is still normal.",
        negativeEvidence: "Taps on Loop Mer still have warm stream.",
        timingCue: "The issue began after the Leth mixer inspection."
      },
      explanations: {
        correct: "The Leth mixer is stuck closed.",
        localLure: "One tap head is blocked.",
        partialLure: "The pump is weak.",
        broadLure: "The whole chamber lost warm stream."
      },
      checks: {
        correct: "Check whether the Leth mixer is opening for the affected loop.",
        local: "Remove one tap head and inspect it for scale.",
        broad: "Ask if the whole chamber has warm stream.",
        redundant: "Run one tap again for another beat."
      }
    }
  },
  {
    id: "shuttle_route",
    templateBias: ["shared_source_vs_local_fault", "broad_check_vs_narrow_decisive_probe", "tempting_low_value_vs_high_value_probe"],
    realWorld: {
      title: "Campus shuttle stop",
      clueBits: {
        symptom: "Two shuttles skipped Stop H during the same hour.",
        spread: "Both drivers reported their route tablets froze near Stop H.",
        localCheck: "One printed stop sign was partly covered by a poster.",
        upstreamIndicator: "The Stop H route beacon battery is flat.",
        dependencyGap: "The route tablet needs the beacon to confirm the stop request.",
        lateDiscriminator: "Stops G and J still register normally on the same route.",
        negativeEvidence: "Only Stop H is skipped.",
        timingCue: "The skips started after the beacon maintenance alert."
      },
      explanations: {
        correct: "The Stop H route beacon is dead.",
        localLure: "The printed Stop H sign is hard to see.",
        partialLure: "One driver missed the stop request.",
        broadLure: "The whole shuttle route is out of sync."
      },
      checks: {
        correct: "Check whether the Stop H route beacon is still powered.",
        local: "Inspect the printed stop sign for visibility.",
        broad: "Review the full shuttle schedule for the day.",
        redundant: "Ask one driver to describe the skipped stop again."
      }
    },
    microWorld: {
      title: "Route Vek beacon",
      ontologyId: "lanor_grid",
      rules: MICRO_WORLD_RULES,
      clueBits: {
        symptom: "Two carriers skipped Node Vek during the same watch.",
        spread: "Both route tablets froze near Node Vek.",
        localCheck: "One printed node sign was partly covered.",
        upstreamIndicator: "The Vek beacon battery is flat.",
        dependencyGap: "The route tablet needs the beacon to confirm the node request.",
        lateDiscriminator: "Nodes Tem and Sol still register normally on the same route.",
        negativeEvidence: "Only Node Vek is skipped.",
        timingCue: "The skips started after the beacon maintenance alert."
      },
      explanations: {
        correct: "The Vek beacon is dead.",
        localLure: "The printed Vek sign is hard to see.",
        partialLure: "One carrier pilot missed the node request.",
        broadLure: "The whole carrier route is out of sync."
      },
      checks: {
        correct: "Check whether the Vek beacon is still powered.",
        local: "Inspect the printed node sign for visibility.",
        broad: "Review the full carrier schedule.",
        redundant: "Ask one pilot to describe the skipped node again."
      }
    }
  }
]);
