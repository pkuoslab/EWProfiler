package com.sei.modules;

import com.sei.agent.Device;
import com.sei.bean.Collection.Graph.GraphAdjustor;
import com.sei.bean.Collection.Tuple2;
import com.sei.bean.View.Action;
import com.sei.bean.View.ViewTree;
import com.sei.server.component.Decision;
import com.sei.util.CommonUtil;
import com.sei.util.ViewUtil;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class DepthFirstStrategy implements Strategy{
    GraphAdjustor graphAdjustor;
    Map<String, Device> devices;
    Map<Tuple2<String, String>, Integer> ErrorLog;


    public DepthFirstStrategy(GraphAdjustor graphAdjustor, Map<String, Device> devices){
        this.graphAdjustor = graphAdjustor;
        this.devices = devices;
        ErrorLog = new HashMap<>();
    }

    public Decision make(String serial, ViewTree currentTree, ViewTree newTree, Decision prev_decision, int response){
        Action new_action = null;
        Device device = devices.get(serial);

        if (response != Device.UI.SAME)
            update_graph(device, prev_decision, currentTree, newTree, response);

        if (response == Device.UI.OUT)
            return new Decision(Decision.CODE.RESTART);

        if (prev_decision.code == Decision.CODE.SEQ && response != Device.UI.NEW)
            ErrorLog.put(new Tuple2<>(serial, prev_decision.target_serial), prev_decision.position);

        int top = device.fragmentStack.getSize() - 1;

        int p = device.fragmentStack.getPosition(newTree);
        if (p != top)
            return new Decision(Decision.CODE.GO, device.fragmentStack.top().getSignature());

        new_action = select_action(device, newTree);
        if (new_action != null)
            return new Decision(Decision.CODE.CONTINUE, new_action);

        CommonUtil.log(newTree.getActivityName() + "_" + newTree.getTreeStructureHash() + " is over");

        if (device.fragmentStack.getSize() > 1) {
            device.fragmentStack.pop();
            return new Decision(Decision.CODE.GO, device.fragmentStack.top().getSignature());
        }else {
            custom(serial);
            return new Decision(Decision.CODE.STOP);
        }
    }

    public void log(String serial, String info){
        CommonUtil.log("device #" + serial + ": " + info);
    }

    public Action select_action(Device d, ViewTree tree){
        return graphAdjustor.getAction(tree);
    }

    public List<Action> compileAction(int id, int pos){
        Device d = devices.get(id);
        List<Action> actions = new ArrayList<>();
        for(int i=0; i <= pos; i++)
            actions.add(d.fragmentStack.get(i).getAction());

        return actions;
    }

    public void update_graph(Device d, Decision prev_decision, ViewTree currentTree, ViewTree newTree, int response){
        graphAdjustor.update(d, prev_decision.action, currentTree, newTree, response);
    }

    public void custom(String serial){}
}
