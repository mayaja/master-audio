import { masteringProfiles } from "@/mastering/types/mastering";
import AppHeader from "@/mastering/components/app/AppHeader";
import AppLeftSidebar from "@/mastering/components/app/AppLeftSidebar";
import AppMainContent from "@/mastering/components/app/AppMainContent";
import AppRightSidebar from "@/mastering/components/app/AppRightSidebar";
import AppModals from "@/mastering/components/app/AppModals";
import { useMasteringController } from "@/mastering/hooks/useMasteringController";

export default function App() {
  const controller = useMasteringController();
  const controlsDisabled = !controller.canPlay;

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_12%_0%,#1a2a3a_0%,#0a101a_35%,#05070d_100%)] text-zinc-100">
      <div className="mx-auto flex w-full max-w-[1880px] flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <AppHeader
          isScrolled={controller.isScrolled}
          statusNote={controller.statusNote}
          activePresetName={controller.activePresetData.name}
          integrated={controller.integrated}
          truePeak={controller.truePeak}
          loudnessState={controller.loudnessState}
          profiles={masteringProfiles}
          activeProfileId={controller.activeProfileId}
          onProfileChange={(id) => controller.setActiveProfileId(id)}
          onApplyTarget={controller.handleApplyTarget}
          adaptMode={controller.adaptMode}
          onAdaptModeChange={controller.setAdaptMode}
          canPlay={controller.canPlay}
          isAdapting={controller.isAdapting}
          adaptProgress={controller.adaptProgress}
          onAutoAdapt={controller.handleAutoAdapt}
          masterMode={controller.masterMode}
          onApplyMasterMode={controller.handleApplyMasterMode}
          onLoadAudio={controller.handleLoadAudio}
          transportState={controller.transportState}
          onPlay={controller.handlePlay}
          onPause={controller.handlePause}
          onStop={controller.handleStop}
          abMode={controller.abMode}
          onToggleAbMode={controller.handleToggleAbMode}
          isExporting={controller.isExporting}
          onExport={() => {
            void controller.handleExport();
          }}
          onExportReport={controller.handleExportReport}
        />

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[260px_minmax(780px,1fr)_320px] 2xl:grid-cols-[280px_minmax(860px,1fr)_340px]">
          <AppLeftSidebar
            inputGain={controller.inputGain}
            outputGain={controller.outputGain}
            toneLow={controller.toneLow}
            toneMid={controller.toneMid}
            toneHigh={controller.toneHigh}
            onInputGainChange={controller.setInputGain}
            onOutputGainChange={controller.setOutputGain}
            onLowChange={controller.handleLow}
            onMidChange={controller.handleMid}
            onHighChange={controller.handleHigh}
            bands={controller.bands}
            setBands={controller.setBands}
            disabled={controlsDisabled}
          />

          <AppMainContent
            audioUrl={controller.audioUrl}
            onWaveformReady={controller.setWaveSurfer}
            leftDb={controller.leftDb}
            rightDb={controller.rightDb}
            presets={controller.presets}
            activePreset={controller.activePreset}
            presetDescriptions={controller.presetDescriptions}
            onSelectPreset={controller.handlePresetSelect}
            bands={controller.bands}
            setBands={controller.setBands}
            tonalTarget={controller.activePresetData.tonalTarget}
            comp={controller.comp}
            setComp={controller.setComp}
            limiter={controller.limiter}
            setLimiter={controller.setLimiter}
            activeProfile={controller.activeProfile}
            integrated={controller.integrated}
            shortTerm={controller.shortTerm}
            truePeak={controller.truePeak}
            crest={controller.crest}
            correlation={controller.correlation}
            disabled={controlsDisabled}
          />

          <AppRightSidebar
            integrated={controller.integrated}
            truePeak={controller.truePeak}
            tonalTarget={controller.activePresetData.tonalTarget}
          />
        </div>

        <AppModals
          isExportConfirmOpen={controller.isExportConfirmOpen}
          validationFailCount={controller.validationSummary.fail}
          isExporting={controller.isExporting}
          exportProgress={controller.exportProgress}
          exportMessage={controller.exportMessage}
          onCancelExport={() => {
            controller.setIsExportConfirmOpen(false);
            controller.setStatusNote("Export cancelled. Please fix the FAIL items first.");
          }}
          onConfirmExport={() => {
            controller.setIsExportConfirmOpen(false);
            void controller.proceedExport();
          }}
          isPrivacyNoticeOpen={controller.isPrivacyNoticeOpen}
          onAcknowledgePrivacy={controller.acknowledgePrivacyNotice}
        />
      </div>
    </main>
  );
}
